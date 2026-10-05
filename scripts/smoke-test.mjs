// 내장 서버 스모크 테스트: 사이트·접수 API·계정/역할별 권한·열람 기록을 확인합니다.
// 사용법: npm run build && npm run test:smoke
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const PORT = 8790 + Math.floor(Math.random() * 100)
const BASE = `http://localhost:${PORT}`
const ADMIN = { username: 'admin', password: 'smoke-admin-pass' }
const dataDir = await mkdtemp(path.join(tmpdir(), 'gcnb-smoke-'))

const server = spawn(process.execPath, ['server/index.js'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DATA_DIR: dataDir,
    CRM_WEBHOOK_URL: '',
    TRUST_PROXY: '',
    INITIAL_ADMIN_USERNAME: ADMIN.username,
    INITIAL_ADMIN_PASSWORD: ADMIN.password,
  },
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

const req = (p, { token, method = 'GET', body } = {}) =>
  fetch(`${BASE}/api${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body && JSON.stringify(body),
  })
const json = async (p, opts) => (await req(p, opts)).json()
const login = async (username, password) => (await json('/auth/login', { method: 'POST', body: { username, password } })).token
const consent = new Date().toISOString()

try {
  await waitForServer()

  // ── 공개 사이트·접수 ─────────────────────────
  const page = await fetch(`${BASE}/`)
  check('사이트 페이지 응답', page.ok && (await page.text()).includes('<div id="root">'), `status ${page.status}`)

  const bad = await req('/leads', { method: 'POST', body: { name: '연락처 없음', consent } })
  check('필수값 누락 시 400', bad.status === 400, `status ${bad.status}`)

  const spam = await req('/leads', { method: 'POST', body: { name: 'bot', phone: '0', consent, website: 'x' } })
  check('스팸(숨김 필드) 무시', spam.status === 201)

  // ── 계정 ───────────────────────────────────
  check('토큰 없이 CRM API 거부', (await req('/crm/leads')).status === 401)
  check('틀린 비밀번호 거부', (await req('/auth/login', { method: 'POST', body: { ...ADMIN, password: 'wrong-password' } })).status === 401)

  const admin = await login(ADMIN.username, ADMIN.password)
  check('초기 관리자 로그인', Boolean(admin))

  const mk = async (body) => (await json('/admin/users', { token: admin, method: 'POST', body })).user
  const kim = await mk({ username: 'kim', name: '김상담', role: 'staff', code: 'ST-KIM01', password: 'kim-password-1' })
  const lee = await mk({ username: 'lee', name: '이상담', role: 'staff', password: 'lee-password-1' })
  const hanoi = await mk({ username: 'hanoi', name: 'Hanoi Study', role: 'partner', code: 'VN-HANOI', password: 'hanoi-password' })
  check('직원·유학원 계정 생성', Boolean(kim && lee && hanoi))
  const noCode = await req('/admin/users', { token: admin, method: 'POST', body: { username: 'nocode', name: 'x', role: 'partner', password: 'nocode-password' } })
  check('파트너 코드 없는 유학원 계정 거부', noCode.status === 400)

  // ── 신청 접수와 배정 ──────────────────────────
  const post = async (body) => (await json('/leads', { method: 'POST', body: { phone: '010', consent, ...body } })).id
  const lan = await post({ name: 'Lan', attribution: { partner: 'vn-hanoi', utm_source: 'zalo' } })
  const aziz = await post({ name: 'Aziz', attribution: { staff: 'st-kim01' } })
  const bold = await post({ name: 'Bold' })
  await req(`/crm/leads/${lan}`, { token: admin, method: 'PATCH', body: { assigneeId: lee.id } })
  await req(`/crm/leads/${bold}`, { token: admin, method: 'PATCH', body: { assigneeId: lee.id } })

  const kimT = await login('kim', 'kim-password-1')
  const leeT = await login('lee', 'lee-password-1')
  const hanoiT = await login('hanoi', 'hanoi-password')
  const names = async (t) => (await json('/crm/leads', { token: t })).leads.map((l) => l.name).sort().join(',')

  check('관리자: 전체 조회', (await names(admin)) === 'Aziz,Bold,Lan', await names(admin))
  check('직원: 직원 링크 유입 신청 자동 배정 (김상담 → Aziz)', (await names(kimT)) === 'Aziz', await names(kimT))
  check('직원: 배정된 학생만 조회 (이상담 → Bold, Lan)', (await names(leeT)) === 'Bold,Lan', await names(leeT))
  check('유학원: 본인 코드로 유입된 학생만 조회', (await names(hanoiT)) === 'Lan', await names(hanoiT))

  const list = await json('/crm/leads', { token: admin })
  check('목록에는 연락처가 포함되지 않음', list.leads.every((l) => !('phone' in l)))

  check('직원: 배정된 학생 상세 열람 (연락처 포함)', (await json(`/crm/leads/${aziz}`, { token: kimT })).lead?.phone === '010')
  check('직원: 배정되지 않은 학생 열람 차단', (await req(`/crm/leads/${bold}`, { token: kimT })).status === 404)
  const upd = await req(`/crm/leads/${bold}`, { token: leeT, method: 'PATCH', body: { status: 'contacted', note: '전화 상담', assigneeId: kim.id } })
  const updBody = await upd.json()
  check('직원: 담당 학생 상태·메모 수정', upd.ok && updBody.lead.status === 'contacted')
  check('직원: 담당자 변경 불가 (무시됨)', updBody.lead.assigneeId === lee.id)

  check('유학원: 수정 불가', (await req(`/crm/leads/${lan}`, { token: hanoiT, method: 'PATCH', body: { status: 'lost' } })).status === 403)
  const partnerView = (await json(`/crm/leads/${lan}`, { token: hanoiT })).lead
  check('유학원: 내부 메모·담당자 ID 숨김', partnerView && !('notes' in partnerView) && !('assigneeId' in partnerView))

  const reg = await req('/crm/leads', { token: hanoiT, method: 'POST', body: { name: 'Minh', phone: '011', consent, attribution: { partner: 'OTHER' } } })
  check('유학원: 학생 직접 등록', reg.status === 201)
  check('유학원: 등록 시 본인 코드 강제 적용·조회', (await names(hanoiT)) === 'Lan,Minh', await names(hanoiT))

  check('유학원: CSV 내보내기 불가', (await req('/crm/leads.csv', { token: hanoiT })).status === 403)
  check('직원: 계정 관리 불가', (await req('/admin/users', { token: kimT })).status === 403)
  check('직원: 열람 기록 조회 불가', (await req('/admin/audit', { token: kimT })).status === 403)

  const csv = await (await req('/crm/leads.csv', { token: admin })).text()
  check('관리자 CSV 내보내기', csv.includes('Lan') && csv.includes('VN-HANOI'))

  const stats = await json('/crm/stats', { token: admin })
  check('직원 코드별 성과 집계', stats.staff[0]?.code === 'ST-KIM01', JSON.stringify(stats.staff))

  // ── 열람 기록 ──────────────────────────────
  const leadAudit = (await json(`/crm/leads/${lan}/audit`, { token: admin })).entries
  const actions = (u, a) => leadAudit.some((e) => e.username === u && e.action === a)
  check('열람 기록: 유학원의 상세 열람', actions('hanoi', 'lead.view'))
  check('열람 기록: 유학원의 목록 조회', actions('hanoi', 'lead.list'))
  check('열람 기록: 관리자의 담당자 배정', actions('admin', 'lead.update'))
  const denied = await json(`/admin/audit?userId=${kim.id}&action=lead.denied`, { token: admin })
  check('열람 기록: 권한 없는 열람 시도', denied.entries.length === 1)
  const failedLogin = await json('/admin/audit?action=auth.login_failed', { token: admin })
  check('열람 기록: 로그인 실패', failedLogin.entries.length >= 1)

  // ── 계정 중지·비밀번호 ────────────────────────
  await req(`/admin/users/${kim.id}`, { token: admin, method: 'PATCH', body: { active: false } })
  check('계정 중지 시 즉시 로그아웃', (await req('/crm/leads', { token: kimT })).status === 401)
  check('중지된 계정 로그인 불가', !(await login('kim', 'kim-password-1')))

  const changed = await json('/auth/password', { token: leeT, method: 'POST', body: { current: 'lee-password-1', next: 'lee-new-password' } })
  check('비밀번호 변경 후 새 토큰 발급', Boolean(changed.token) && (await req('/crm/leads', { token: leeT })).status === 401)
  check('새 비밀번호로 로그인', Boolean(await login('lee', 'lee-new-password')))

  let blocked = false
  for (let i = 0; i < 6; i++) if ((await req('/auth/login', { method: 'POST', body: { username: 'lee', password: 'nope-nope' } })).status === 429) blocked = true
  check('로그인 5회 실패 시 차단', blocked)

  // ── 기타 보안 ──────────────────────────────
  let limited = false
  for (let i = 0; i < 10; i++) {
    // X-Forwarded-For 를 바꿔도(TRUST_PROXY 미설정) 같은 IP로 집계되어야 합니다.
    const r = await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.0.0.${i}` },
      body: JSON.stringify({ name: 'x', phone: '0', consent, website: 'bot' }),
    })
    if (r.status === 429) limited = true
  }
  check('IP당 접수 제한 (X-Forwarded-For 조작 무시)', limited)
  check('경로 탐색 차단', (await fetch(`${BASE}/..%2fpackage.json`)).status === 403)
} catch (err) {
  check('스모크 테스트 실행', false, err.stack)
} finally {
  server.kill()
  await rm(dataDir, { recursive: true, force: true })
}

console.log(failed ? `\n${failed}개 실패` : '\n모든 검사 통과')
process.exit(failed ? 1 : 0)
