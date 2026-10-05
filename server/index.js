// Global C&B 내장 서버
// - 웹사이트 상담·파트너 신청 접수 (POST /api/leads)
// - 계정·역할별 권한이 있는 내부 CRM API (관리자 / 직원 / 유학원)
// - 열람·변경 기록(audit log)
// - 외부 CRM 연동 준비: CRM_WEBHOOK_URL 을 설정하면 신규 리드를 그대로 전달
// - 빌드된 사이트(dist/) 정적 서빙
import { createHmac } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { canEdit, canSee, detailFor, summary } from './access.js'
import { createAudit } from './audit.js'
import {
  MIN_PASSWORD,
  createLoginThrottle,
  createSessions,
  hashPassword,
  publicUser,
  validateUserInput,
  verifyPassword,
} from './auth.js'
import { buildStats, sanitizeLead, toCsv } from './leads.js'
import { STATUSES, createCollection, newLead } from './store.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  process.loadEnvFile(path.join(root, '.env'))
} catch {
  // .env 가 없으면 환경변수만 사용
}

const PORT = Number(process.env.PORT || 8787)
const WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || ''
const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET || ''
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
const DIST = path.join(root, 'dist')
const DATA_DIR = process.env.DATA_DIR || path.join(root, 'data')

const leads = createCollection(DATA_DIR, 'leads')
const users = createCollection(DATA_DIR, 'users')
const audit = createAudit(DATA_DIR)
const sessions = createSessions()
const loginThrottle = createLoginThrottle()

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

// 리버스 프록시(nginx·클라우드 로드밸런서) 뒤에서만 X-Forwarded-For 를 신뢰합니다.
// 그 외에는 누구나 헤더를 조작해 접수 제한을 우회할 수 있습니다.
const TRUST_PROXY = process.env.TRUST_PROXY === '1'
function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for']?.split(',')[0].trim()
    if (forwarded) return forwarded
  }
  return req.socket.remoteAddress
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

// 처음 실행 시 계정이 하나도 없으면 INITIAL_ADMIN_* 으로 관리자 계정을 만듭니다.
async function bootstrapAdmin() {
  if ((await users.list()).length > 0) return
  const username = (process.env.INITIAL_ADMIN_USERNAME || '').trim().toLowerCase()
  const password = process.env.INITIAL_ADMIN_PASSWORD || ''
  if (!username || password.length < MIN_PASSWORD) {
    console.warn(`⚠ 계정이 없습니다. INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD(${MIN_PASSWORD}자 이상)를 설정하거나 npm run user -- create 로 관리자를 만드세요.`)
    return
  }
  await users.create({ username, name: '관리자', role: 'admin', code: '', active: true, passwordHash: await hashPassword(password), mustChangePassword: true })
  console.log(`초기 관리자 계정 생성: ${username} (첫 로그인 후 비밀번호를 변경하세요)`)
}

// 로그인한 사용자 확인 (비활성화된 계정은 즉시 차단)
async function authenticate(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const session = sessions.get(token)
  if (!session) return null
  const user = await users.get(session.userId)
  if (!user || user.active === false) {
    sessions.delete(token)
    return null
  }
  return { user, token }
}

function actor(user, req) {
  return { userId: user.id, username: user.username, role: user.role, ip: clientIp(req) }
}

async function visibleLeads(user) {
  return (await leads.list()).filter((l) => canSee(user, l))
}

async function handleAuth(req, res, pathname, method) {
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await readJson(req)
    const username = String(body.username || '').trim().toLowerCase()
    const ip = clientIp(req)
    if (loginThrottle.blocked(ip, username)) {
      await audit.log({ action: 'auth.login_blocked', username, ip })
      return send(res, 429, { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.' })
    }
    const user = await users.find((u) => u.username === username)
    const ok = user && user.active !== false && (await verifyPassword(String(body.password || ''), user.passwordHash))
    if (!ok) {
      loginThrottle.fail(ip, username)
      await audit.log({ action: 'auth.login_failed', username, ip })
      return send(res, 401, { error: '아이디 또는 비밀번호가 올바르지 않습니다.' })
    }
    loginThrottle.reset(ip, username)
    const token = sessions.create(user.id)
    const updated = await users.update(user.id, { lastLoginAt: new Date().toISOString() })
    await audit.log({ action: 'auth.login', ...actor(user, req) })
    return send(res, 200, { token, user: publicUser(updated) })
  }

  const auth = await authenticate(req)
  if (!auth) return send(res, 401, { error: 'unauthorized' })
  const { user, token } = auth

  if (pathname === '/api/auth/me' && method === 'GET') {
    return send(res, 200, { user: publicUser(user) })
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    sessions.delete(token)
    await audit.log({ action: 'auth.logout', ...actor(user, req) })
    return send(res, 200, { ok: true })
  }
  if (pathname === '/api/auth/password' && method === 'POST') {
    const body = await readJson(req)
    if (!(await verifyPassword(String(body.current || ''), user.passwordHash))) {
      return send(res, 400, { error: '현재 비밀번호가 올바르지 않습니다.' })
    }
    if (String(body.next || '').length < MIN_PASSWORD) return send(res, 400, { error: `새 비밀번호는 ${MIN_PASSWORD}자 이상` })
    await users.update(user.id, { passwordHash: await hashPassword(body.next), mustChangePassword: false })
    // 다른 기기의 로그인은 끊고, 현재 화면에는 새 토큰을 발급합니다.
    sessions.deleteUser(user.id)
    await audit.log({ action: 'auth.password_changed', ...actor(user, req) })
    return send(res, 200, { ok: true, token: sessions.create(user.id), user: publicUser(await users.get(user.id)) })
  }
  return send(res, 404, { error: 'not found' })
}

async function handleCrm(req, res, url, user) {
  const { pathname } = url
  const method = req.method
  const who = actor(user, req)

  if (pathname === '/api/crm/leads' && method === 'GET') {
    const list = await visibleLeads(user)
    await audit.log({ action: 'lead.list', ...who, count: list.length, leadIds: list.slice(0, 500).map((l) => l.id) })
    const staff = user.role === 'admin' ? (await users.list()).filter((u) => u.role === 'staff' && u.active !== false).map(publicUser) : []
    return send(res, 200, { leads: list.map(summary), statuses: STATUSES, staff, webhook: Boolean(WEBHOOK_URL) })
  }

  // 유학원이 학생을 직접 등록 (본인 파트너 코드가 자동으로 붙습니다)
  if (pathname === '/api/crm/leads' && method === 'POST') {
    if (user.role !== 'partner') return send(res, 403, { error: 'forbidden' })
    const body = await readJson(req)
    const { lead, error } = sanitizeLead({ ...body, attribution: { partner: user.code } })
    if (error) return send(res, 400, { error })
    const saved = await leads.create(newLead({ ...lead, createdBy: user.id, source: 'partner-portal' }))
    await audit.log({ action: 'lead.create', ...who, leadId: saved.id })
    const forward = await forwardLead(saved)
    if (forward) await leads.update(saved.id, { forward })
    return send(res, 201, { ok: true, id: saved.id })
  }

  if (pathname === '/api/crm/stats' && method === 'GET') {
    return send(res, 200, buildStats(await visibleLeads(user)))
  }

  if (pathname === '/api/crm/leads.csv' && method === 'GET') {
    if (user.role === 'partner') return send(res, 403, { error: 'forbidden' })
    const list = await visibleLeads(user)
    await audit.log({ action: 'lead.export', ...who, count: list.length, leadIds: list.slice(0, 500).map((l) => l.id) })
    const date = new Date().toISOString().slice(0, 10)
    return send(res, 200, toCsv(list), {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="globalcnb-leads-${date}.csv"`,
    })
  }

  const m = pathname.match(/^\/api\/crm\/leads\/([\w-]+)(\/forward|\/audit)?$/)
  if (m) {
    const lead = await leads.get(m[1])
    // 권한이 없는 신청은 존재 여부도 알리지 않습니다.
    if (!lead || !canSee(user, lead)) {
      if (lead) await audit.log({ action: 'lead.denied', ...who, leadId: m[1] })
      return send(res, 404, { error: 'not found' })
    }

    if (!m[2] && method === 'GET') {
      await audit.log({ action: 'lead.view', ...who, leadId: lead.id })
      return send(res, 200, { lead: detailFor(user, lead), canEdit: canEdit(user, lead) })
    }

    if (!m[2] && method === 'PATCH') {
      if (!canEdit(user, lead)) return send(res, 403, { error: 'forbidden' })
      const body = await readJson(req)
      const patch = {}
      const changed = []
      if (STATUSES.includes(body.status) && body.status !== lead.status) {
        patch.status = body.status
        changed.push(`status:${lead.status}→${body.status}`)
      }
      // 담당 직원 배정은 관리자만
      if (user.role === 'admin' && typeof body.assigneeId === 'string' && body.assigneeId !== lead.assigneeId) {
        const staff = body.assigneeId ? await users.get(body.assigneeId) : null
        if (body.assigneeId && (!staff || staff.role !== 'staff')) return send(res, 400, { error: '직원 계정만 배정할 수 있습니다' })
        patch.assigneeId = staff?.id || ''
        patch.assignee = staff?.name || ''
        changed.push(`assignee:${lead.assignee || '-'}→${patch.assignee || '-'}`)
      }
      if (typeof body.note === 'string' && body.note.trim()) {
        patch.notes = [...(lead.notes || []), { at: new Date().toISOString(), by: user.name, byId: user.id, text: body.note.trim().slice(0, 1000) }]
        changed.push('note')
      }
      if (!changed.length) return send(res, 200, { lead: detailFor(user, lead), canEdit: true })
      const updated = await leads.update(lead.id, patch)
      await audit.log({ action: 'lead.update', ...who, leadId: lead.id, changes: changed })
      return send(res, 200, { lead: detailFor(user, updated), canEdit: canEdit(user, updated) })
    }

    if (m[2] === '/forward' && method === 'POST') {
      if (user.role !== 'admin') return send(res, 403, { error: 'forbidden' })
      if (!WEBHOOK_URL) return send(res, 400, { error: 'CRM_WEBHOOK_URL is not configured' })
      const updated = await leads.update(lead.id, { forward: await forwardLead(lead) })
      await audit.log({ action: 'lead.forward', ...who, leadId: lead.id })
      return send(res, 200, { lead: detailFor(user, updated), canEdit: true })
    }

    if (m[2] === '/audit' && method === 'GET') {
      if (user.role !== 'admin') return send(res, 403, { error: 'forbidden' })
      return send(res, 200, { entries: await audit.query({ leadId: lead.id, limit: 100 }) })
    }
  }
  return send(res, 404, { error: 'not found' })
}

async function handleAdmin(req, res, url, user) {
  const { pathname } = url
  const method = req.method
  if (user.role !== 'admin') return send(res, 403, { error: 'forbidden' })
  const who = actor(user, req)

  if (pathname === '/api/admin/users' && method === 'GET') {
    return send(res, 200, { users: (await users.list()).map(publicUser) })
  }
  if (pathname === '/api/admin/users' && method === 'POST') {
    const body = await readJson(req)
    const { value, error } = validateUserInput(body, { requirePassword: true })
    if (error) return send(res, 400, { error })
    if (await users.find((u) => u.username === value.username)) return send(res, 409, { error: '이미 사용 중인 아이디입니다' })
    const created = await users.create({ ...value, active: true, passwordHash: await hashPassword(body.password), mustChangePassword: true })
    await audit.log({ action: 'user.create', ...who, targetUserId: created.id, targetUsername: created.username, targetRole: created.role })
    return send(res, 201, { user: publicUser(created) })
  }

  const m = pathname.match(/^\/api\/admin\/users\/([\w-]+)$/)
  if (m && method === 'PATCH') {
    const target = await users.get(m[1])
    if (!target) return send(res, 404, { error: 'not found' })
    const body = await readJson(req)
    const { value, error } = validateUserInput({ ...publicUser(target), ...body }, { requirePassword: false })
    if (error) return send(res, 400, { error })
    if (target.id === user.id && (value.role !== 'admin' || body.active === false)) {
      return send(res, 400, { error: '본인 계정의 관리자 권한은 해제할 수 없습니다' })
    }
    const patch = { name: value.name, role: value.role, code: value.code }
    if (typeof body.active === 'boolean') patch.active = body.active
    if (body.password) {
      if (String(body.password).length < MIN_PASSWORD) return send(res, 400, { error: `비밀번호는 ${MIN_PASSWORD}자 이상` })
      patch.passwordHash = await hashPassword(body.password)
      patch.mustChangePassword = true
    }
    const updated = await users.update(target.id, patch)
    // 권한·비밀번호가 바뀌거나 비활성화되면 기존 로그인을 끊습니다.
    if (body.password || patch.active === false || patch.role !== target.role || patch.code !== target.code) sessions.deleteUser(target.id)
    const changes = Object.keys(patch).filter((k) => k !== 'passwordHash' && patch[k] !== target[k])
    if (body.password) changes.push('password')
    await audit.log({ action: 'user.update', ...who, targetUserId: target.id, targetUsername: target.username, changes })
    return send(res, 200, { user: publicUser(updated) })
  }

  if (pathname === '/api/admin/audit' && method === 'GET') {
    const q = url.searchParams
    const entries = await audit.query({
      userId: q.get('userId') || undefined,
      action: q.get('action') || undefined,
      leadId: q.get('leadId') || undefined,
      limit: Math.min(Number(q.get('limit')) || 200, 1000),
    })
    // 목록 조회 기록의 긴 ID 목록은 화면용 응답에서 생략
    return send(res, 200, { entries: entries.map(({ leadIds: _ids, ...e }) => e) })
  }
  return send(res, 404, { error: 'not found' })
}

async function handleApi(req, res, url) {
  const { pathname } = url
  const method = req.method

  if (pathname === '/api/health') {
    return send(res, 200, { ok: true, accounts: (await users.list()).length > 0, webhook: Boolean(WEBHOOK_URL) })
  }

  if (pathname === '/api/leads' && method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req))
    return res.end()
  }

  // 공개 상담 신청 접수
  if (pathname === '/api/leads' && method === 'POST') {
    const cors = corsHeaders(req)
    if (rateLimited(clientIp(req))) return send(res, 429, { error: 'too many requests' }, cors)
    const body = await readJson(req)
    if (body.website) return send(res, 201, { ok: true }, cors) // 스팸 봇: 저장하지 않음
    const { lead, error } = sanitizeLead(body)
    if (error) return send(res, 400, { error }, cors)
    // 직원 홍보 링크로 들어온 신청은 해당 직원에게 자동 배정
    const staffCode = lead.attribution.staff?.toUpperCase()
    const owner = staffCode && (await users.find((u) => u.role === 'staff' && u.active !== false && u.code === staffCode))
    const saved = await leads.create(
      newLead({
        ...lead,
        source: 'website',
        userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
        ...(owner ? { assigneeId: owner.id, assignee: owner.name } : {}),
      }),
    )
    if (owner) await audit.log({ action: 'lead.auto_assign', userId: 'system', username: 'system', role: 'system', leadId: saved.id, changes: [`assignee:-→${owner.name}`] })
    const forward = await forwardLead(saved)
    if (forward) await leads.update(saved.id, { forward })
    return send(res, 201, { ok: true, id: saved.id }, cors)
  }

  if (pathname.startsWith('/api/auth/')) return handleAuth(req, res, pathname, method)

  const auth = await authenticate(req)
  if (!auth) return send(res, 401, { error: 'unauthorized' })
  if (pathname.startsWith('/api/crm/')) return handleCrm(req, res, url, auth.user)
  if (pathname.startsWith('/api/admin/')) return handleAdmin(req, res, url, auth.user)
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

await bootstrapAdmin()
server.listen(PORT, () => {
  console.log(`Global C&B server → http://localhost:${PORT}`)
  console.log(WEBHOOK_URL ? `외부 CRM 전달: ${WEBHOOK_URL}` : '외부 CRM 미연결 — 내장 CRM 에만 저장합니다.')
})
