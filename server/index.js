// Global C&B 내장 서버
// - 웹사이트 상담·파트너 신청 접수 (POST /api/leads)
// - 내부 CRM 관리 API (리드 조회·상태 변경·메모·통계·CSV)
// - 외부 CRM 연동 준비: CRM_WEBHOOK_URL 을 설정하면 신규 리드를 그대로 전달
// - 빌드된 사이트(dist/) 정적 서빙
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStats, sanitizeLead, toCsv } from './leads.js'
import { STATUSES, createStore } from './store.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  process.loadEnvFile(path.join(root, '.env'))
} catch {
  // .env 가 없으면 환경변수만 사용
}

const PORT = Number(process.env.PORT || 8787)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || ''
const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || ''
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
const DIST = path.join(root, 'dist')
const store = createStore(process.env.DATA_DIR || path.join(root, 'data'))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}

function send(res, status, body, headers = {}) {
  const isText = typeof body === 'string'
  res.writeHead(status, {
    'Content-Type': isText ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  })
  res.end(isText ? body : JSON.stringify(body))
}

function readJson(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(Object.assign(new Error('payload too large'), { status: 413 }))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(Object.assign(new Error('invalid json'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function isAdmin(req) {
  if (!ADMIN_TOKEN) return false
  const given = Buffer.from((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))
  const expected = Buffer.from(ADMIN_TOKEN)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

// IP당 10분에 10건까지 접수
const hits = new Map()
function rateLimited(ip) {
  const now = Date.now()
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  list.push(now)
  hits.set(ip, list)
  return list.length > 10
}

function corsHeaders(req) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' }
  }
  return {}
}

// 외부 CRM 으로 전달 (설정된 경우). 실패해도 접수는 유지되고 관리 화면에서 재전송할 수 있습니다.
async function forwardLead(lead) {
  if (!WEBHOOK_URL) return null
  const body = JSON.stringify({ event: 'lead.created', lead })
  const headers = { 'Content-Type': 'application/json' }
  if (WEBHOOK_SECRET) headers['X-GCNB-Signature'] = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  try {
    const r = await fetch(WEBHOOK_URL, { method: 'POST', headers, body, signal: AbortSignal.timeout(8000) })
    return { ok: r.ok, status: r.status, at: new Date().toISOString() }
  } catch (err) {
    return { ok: false, error: err.message, at: new Date().toISOString() }
  }
}

async function handleApi(req, res, url) {
  const { pathname } = url
  const method = req.method

  if (pathname === '/api/health') {
    return send(res, 200, { ok: true, admin: Boolean(ADMIN_TOKEN), webhook: Boolean(WEBHOOK_URL) })
  }

  if (pathname === '/api/leads' && method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req))
    return res.end()
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const cors = corsHeaders(req)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress
    if (rateLimited(ip)) return send(res, 429, { error: 'too many requests' }, cors)
    const body = await readJson(req)
    if (body.website) return send(res, 201, { ok: true }, cors) // 스팸 봇: 저장하지 않음
    const { lead, error } = sanitizeLead(body)
    if (error) return send(res, 400, { error }, cors)
    const saved = await store.create({ ...lead, userAgent: String(req.headers['user-agent'] || '').slice(0, 200) })
    const forward = await forwardLead(saved)
    if (forward) await store.update(saved.id, { forward })
    return send(res, 201, { ok: true, id: saved.id }, cors)
  }

  // 이하 내부 관리 API
  if (!pathname.startsWith('/api/admin/')) return send(res, 404, { error: 'not found' })
  if (!ADMIN_TOKEN) return send(res, 503, { error: 'ADMIN_TOKEN is not configured' })
  if (!isAdmin(req)) return send(res, 401, { error: 'unauthorized' })

  if (pathname === '/api/admin/leads' && method === 'GET') {
    return send(res, 200, { leads: await store.list(), statuses: STATUSES, webhook: Boolean(WEBHOOK_URL) })
  }
  if (pathname === '/api/admin/stats' && method === 'GET') {
    return send(res, 200, buildStats(await store.list()))
  }
  if (pathname === '/api/admin/leads.csv' && method === 'GET') {
    const date = new Date().toISOString().slice(0, 10)
    return send(res, 200, toCsv(await store.list()), {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="globalcnb-leads-${date}.csv"`,
    })
  }

  const m = pathname.match(/^\/api\/admin\/leads\/([\w-]+)(\/forward)?$/)
  if (m) {
    const lead = await store.get(m[1])
    if (!lead) return send(res, 404, { error: 'not found' })
    if (m[2] && method === 'POST') {
      if (!WEBHOOK_URL) return send(res, 400, { error: 'CRM_WEBHOOK_URL is not configured' })
      return send(res, 200, await store.update(lead.id, { forward: await forwardLead(lead) }))
    }
    if (!m[2] && method === 'PATCH') {
      const body = await readJson(req)
      const patch = {}
      if (STATUSES.includes(body.status)) patch.status = body.status
      if (typeof body.assignee === 'string') patch.assignee = body.assignee.trim().slice(0, 60)
      if (typeof body.note === 'string' && body.note.trim()) {
        patch.notes = [...lead.notes, { at: new Date().toISOString(), by: patch.assignee || lead.assignee || 'admin', text: body.note.trim().slice(0, 1000) }]
      }
      return send(res, 200, await store.update(lead.id, patch))
    }
  }
  return send(res, 404, { error: 'not found' })
}

async function serveStatic(req, res, url) {
  let file = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)))
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return send(res, 403, 'forbidden')
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
  } catch {
    file = path.join(DIST, 'index.html') // SPA 대체 경로
  }
  try {
    const data = await readFile(file)
    const ext = path.extname(file)
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    res.end(data)
  } catch {
    send(res, 404, '사이트 빌드가 없습니다. 먼저 npm run build 를 실행하세요.')
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url)
    else await serveStatic(req, res, url)
  } catch (err) {
    console.error(err)
    if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'server error' })
  }
})

server.listen(PORT, () => {
  console.log(`Global C&B server → http://localhost:${PORT}`)
  if (!ADMIN_TOKEN) console.warn('⚠ ADMIN_TOKEN 이 없어 내부 CRM 관리 화면(#/admin)을 사용할 수 없습니다.')
  console.log(WEBHOOK_URL ? `외부 CRM 전달: ${WEBHOOK_URL}` : '외부 CRM 미연결 — 내장 CRM 에만 저장합니다.')
})
