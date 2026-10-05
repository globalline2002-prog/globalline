// 내장 서버 스모크 테스트: 빌드된 사이트(dist/)와 API가 정상 동작하는지 확인합니다.
// 사용법: npm run build && npm run test:smoke
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const PORT = 8790 + Math.floor(Math.random() * 100)
const BASE = `http://localhost:${PORT}`
const TOKEN = 'smoke-test-token'
const dataDir = await mkdtemp(path.join(tmpdir(), 'gcnb-smoke-'))

const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: String(PORT), ADMIN_TOKEN: TOKEN, DATA_DIR: dataDir, CRM_WEBHOOK_URL: '' },
  stdio: ['ignore', 'pipe', 'inherit'],
})

let failed = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${detail}`}`)
  if (!ok) failed++
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return
    } catch {
      // 아직 시작 전
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('서버가 시작되지 않았습니다')
}

const post = (body) =>
  fetch(`${BASE}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const admin = (p, init = {}) => fetch(`${BASE}/api/admin${p}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } })

try {
  await waitForServer()

  const page = await fetch(`${BASE}/`)
  check('사이트 페이지 응답', page.ok && (await page.text()).includes('<div id="root">'), `status ${page.status}`)

  const health = await (await fetch(`${BASE}/api/health`)).json()
  check('헬스 체크', health.ok && health.admin, JSON.stringify(health))

  const bad = await post({ name: '연락처 없음', consent: new Date().toISOString() })
  check('필수값 누락 시 400', bad.status === 400, `status ${bad.status}`)

  const lead = { name: 'Smoke Test', phone: '+84 900 000 000', consent: new Date().toISOString(), type: 'student', attribution: { staff: 'st-01', utm_source: 'zalo' } }
  const created = await post(lead)
  const { id } = await created.json()
  check('상담 신청 저장', created.status === 201 && Boolean(id), `status ${created.status}`)

  const spam = await post({ ...lead, website: 'bot' })
  check('스팸(숨김 필드) 무시', spam.status === 201)

  const noAuth = await fetch(`${BASE}/api/admin/leads`)
  check('토큰 없이 관리 API 거부', noAuth.status === 401, `status ${noAuth.status}`)

  const { leads } = await (await admin('/leads')).json()
  check('관리 API 리드 조회 (스팸 제외 1건)', leads.length === 1 && leads[0].id === id, `count ${leads.length}`)

  const updated = await (await admin(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'enrolled', assignee: '김상담', note: '등록 완료' }) })).json()
  check('상태·담당자·메모 수정', updated.status === 'enrolled' && updated.notes.length === 1)

  const stats = await (await admin('/stats')).json()
  check('직원 코드별 성과 집계', stats.staff[0]?.code === 'ST-01' && stats.staff[0]?.enrolled === 1, JSON.stringify(stats.staff))

  const csv = await (await admin('/leads.csv')).text()
  check('CSV 내보내기', csv.includes('Smoke Test') && csv.includes('ST-01'))

  // 헤더 조작으로 접수 제한을 우회할 수 없어야 합니다 (위에서 3건 사용, 한도 10건)
  let limited = false
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${BASE}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${i}` }, body: JSON.stringify({ ...lead, website: 'bot' }) })
    if (r.status === 429) limited = true
  }
  check('IP당 접수 제한 (X-Forwarded-For 조작 무시)', limited)

  const traversal = await fetch(`${BASE}/..%2fpackage.json`)
  check('경로 탐색 차단', traversal.status === 403, `status ${traversal.status}`)
} catch (err) {
  check('스모크 테스트 실행', false, err.message)
} finally {
  server.kill()
  await rm(dataDir, { recursive: true, force: true })
}

console.log(failed ? `\n${failed}개 실패` : '\n모든 검사 통과')
process.exit(failed ? 1 : 0)
