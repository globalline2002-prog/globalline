import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { LOGOUT_EVENT, api, getToken, setToken } from '../lib/crmApi'
import AuditTab from './crm/AuditTab'
import LeadsTab from './crm/LeadsTab'
import RegisterTab from './crm/RegisterTab'
import { ErrorText } from './crm/shared'
import { ROLE_LABEL, btnGhost, btnPrimary, input } from './crm/labels'
import UsersTab from './crm/UsersTab'

// 내장 CRM (내부용, 한국어) — 관리자 / 직원 / 유학원 계정별로 보이는 메뉴와 데이터가 다릅니다.
const TABS = {
  admin: [
    ['leads', '신청 관리'],
    ['users', '계정 관리'],
    ['audit', '열람 기록'],
  ],
  staff: [['leads', '내 담당 학생']],
  partner: [
    ['leads', '내 학생'],
    ['register', '학생 등록'],
  ],
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api.login(form.username, form.password)
      setToken(r.token)
      onLogin(r.user)
    } catch (err) {
      setError(err.status === 401 || err.status === 429 ? err.message : `서버에 연결할 수 없습니다. (${err.message})`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Icon name="chart" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Global C&amp;B 내부 CRM</h1>
        <p className="mt-2 text-sm text-ink-soft">관리자·직원·유학원 계정으로 로그인하세요. 계정은 관리자가 발급합니다.</p>
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="아이디"
          autoComplete="username"
          className={`${input} mt-5 py-3`}
          autoFocus
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="비밀번호"
          autoComplete="current-password"
          className={`${input} mt-3 py-3`}
        />
        <ErrorText>{error}</ErrorText>
        <button disabled={busy} className="mt-5 w-full rounded-full bg-brand-600 py-3.5 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          로그인
        </button>
      </form>
    </div>
  )
}

function ChangePassword({ forced, onDone, onCancel }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (form.next !== form.confirm) return setError('새 비밀번호가 서로 다릅니다.')
    try {
      const r = await api.changePassword(form.current, form.next)
      setToken(r.token)
      onDone(r.user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-ink">비밀번호 변경</h1>
        {forced && <p className="mt-2 text-sm text-ink-soft">임시 비밀번호로 로그인했습니다. 계속하려면 새 비밀번호(10자 이상)를 정하세요.</p>}
        {[
          ['current', '현재 비밀번호', 'current-password'],
          ['next', '새 비밀번호 (10자 이상)', 'new-password'],
          ['confirm', '새 비밀번호 확인', 'new-password'],
        ].map(([k, ph, ac]) => (
          <input key={k} type="password" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} autoComplete={ac} className={`${input} mt-3 py-3`} />
        ))}
        <ErrorText>{error}</ErrorText>
        <div className="mt-5 flex gap-2">
          <button className={btnPrimary}>변경</button>
          {!forced && (
            <button type="button" onClick={onCancel} className={btnGhost}>
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function AdminPage() {
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(Boolean(getToken()))
  const [tab, setTab] = useState('leads')
  const [changingPassword, setChangingPassword] = useState(false)

  // 새로고침해도 같은 탭(세션)에서는 로그인이 유지됩니다.
  useEffect(() => {
    if (!getToken()) return
    api.me().then(
      (r) => setMe(r.user),
      () => setToken(''),
    ).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const onLogout = () => {
      setToken('')
      setMe(null)
    }
    window.addEventListener(LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout)
  }, [])

  const logout = async () => {
    await api.logout().catch(() => {})
    setToken('')
    setMe(null)
    setTab('leads')
  }

  if (checking) return <p className="py-24 text-center text-ink-soft">확인 중…</p>
  if (!me) return <Login onLogin={setMe} />
  if (me.mustChangePassword || changingPassword) {
    return (
      <ChangePassword
        forced={me.mustChangePassword}
        onDone={(u) => {
          setMe(u)
          setChangingPassword(false)
        }}
        onCancel={() => setChangingPassword(false)}
      />
    )
  }

  const tabs = TABS[me.role] || []

  return (
    <div className="min-h-[70vh] bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-brand-600">INTERNAL CRM</p>
            <h1 className="text-3xl font-extrabold text-ink">상담 · 추천 · 파트너 관리</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold shadow-sm">
              {me.name} · {ROLE_LABEL[me.role]}
              {me.code && <span className="ml-1 font-mono text-xs text-brand-700">{me.code}</span>}
            </span>
            <button onClick={() => setChangingPassword(true)} className="font-bold text-ink-soft hover:text-ink">
              비밀번호 변경
            </button>
            <button onClick={logout} className="font-bold text-ink-soft hover:text-ink">
              로그아웃
            </button>
          </div>
        </div>

        <nav className="mt-6 flex gap-1 border-b border-slate-200">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-[3px] px-4 py-2.5 text-sm font-bold ${tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-soft hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'leads' && <LeadsTab key={me.id} me={me} />}
          {tab === 'users' && me.role === 'admin' && <UsersTab me={me} />}
          {tab === 'audit' && me.role === 'admin' && <AuditTab />}
          {tab === 'register' && me.role === 'partner' && <RegisterTab me={me} onDone={() => setTab('leads')} />}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
