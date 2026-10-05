import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { platform, platformLink } from '../config'
import { adminApi, getToken, setToken } from '../lib/adminApi'

// 내장 CRM 관리 화면 (내부용, 한국어). 외부 CRM 이 준비되기 전까지 상담·추천·파트너 유입을 관리합니다.
const STATUS_LABEL = { new: '신규', contacted: '상담 중', 'level-test': '레벨테스트', enrolled: '등록 확정', lost: '종료' }
const STATUS_STYLE = {
  new: 'bg-brand-50 text-brand-700',
  contacted: 'bg-amber-50 text-amber-700',
  'level-test': 'bg-sky-50 text-sky-700',
  enrolled: 'bg-lime-soft text-ink',
  lost: 'bg-slate-100 text-slate-500',
}
const TYPE_LABEL = { student: '학생·학부모', partner: '유학원·파트너', university: '대학·교육기관', company: '기업' }
const SOURCE_LABEL = { staff: '직원', partner: '유학원', ref: '추천인', manual: '직접 입력 코드', direct: '직접 방문' }

function sourceOf(lead) {
  const a = lead.attribution || {}
  if (a.staff) return ['staff', a.staff.toUpperCase()]
  if (a.partner) return ['partner', a.partner.toUpperCase()]
  if (a.ref) return ['ref', a.ref.toUpperCase()]
  if (lead.code) return ['manual', lead.code]
  return ['direct', '']
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-')

function Login({ onLogin, error }) {
  const [value, setValue] = useState('')
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onLogin(value.trim())
        }}
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Icon name="chart" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">내장 CRM 관리</h1>
        <p className="mt-2 text-sm text-ink-soft">서버 환경변수 ADMIN_TOKEN 에 설정한 관리자 토큰을 입력하세요.</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="관리자 토큰"
          className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          autoFocus
        />
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <button className="mt-5 w-full rounded-full bg-brand-600 py-3.5 font-bold text-white hover:bg-brand-700">로그인</button>
      </form>
    </div>
  )
}

function StatCard({ label, value, tone = 'bg-white' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-4 ${tone}`}>
      <p className="text-xs font-bold text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  )
}

function CodeTable({ title, rows, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-extrabold text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs text-ink-soft">
            <tr>
              <th className="py-1.5">코드</th>
              <th className="py-1.5 text-right">유입</th>
              <th className="py-1.5 text-right">등록</th>
              <th className="py-1.5 text-right">전환율</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.code} className="border-t border-slate-100">
                <td className="py-2 font-mono font-semibold">{r.code}</td>
                <td className="py-2 text-right">{r.leads}</td>
                <td className="py-2 text-right">{r.enrolled}</td>
                <td className="py-2 text-right">{Math.round((r.enrolled / r.leads) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Breakdown({ title, data, labels = {} }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...entries.map(([, v]) => v))
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-extrabold text-ink">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.length === 0 && <li className="text-ink-soft">데이터 없음</li>}
        {entries.map(([k, v]) => (
          <li key={k}>
            <div className="flex justify-between">
              <span>{labels[k] || k}</span>
              <span className="font-bold">{v}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LeadDetail({ lead, statuses, webhook, onClose, onSaved }) {
  const [status, setStatus] = useState(lead.status)
  const [assignee, setAssignee] = useState(lead.assignee)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [kind, code] = sourceOf(lead)

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      onSaved(await adminApi.update(lead.id, { status, assignee, note }))
      setNote('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const forward = async () => {
    setBusy(true)
    setError('')
    try {
      onSaved(await adminApi.forward(lead.id))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const rows = [
    ['신청 유형', TYPE_LABEL[lead.type]],
    ['기관·회사', lead.org],
    ['국가', lead.country],
    ['연락처', lead.phone],
    ['이메일', lead.email],
    ['선호 연락', lead.contactPref],
    ['관심 분야', lead.interest],
    ['과정 찾기 결과', lead.finder],
    ['상담 언어', lead.preferredLanguage],
    ['유입 경로', `${SOURCE_LABEL[kind]}${code ? ` · ${code}` : ''}`],
    ['채널 · 캠페인', [lead.attribution?.utm_source, lead.attribution?.utm_campaign].filter(Boolean).join(' · ')],
    ['신청일', fmt(lead.createdAt)],
    ['개인정보 동의', fmt(lead.consentAt)],
  ]

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40" onClick={onClose}>
      <aside className="ml-auto h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600">{TYPE_LABEL[lead.type]}</p>
            <h2 className="text-2xl font-extrabold text-ink">{lead.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>

        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-4 py-2">
              <dt className="w-28 shrink-0 text-ink-soft">{k}</dt>
              <dd className="font-medium text-ink">{v || '-'}</dd>
            </div>
          ))}
        </dl>
        {lead.message && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface p-4 text-sm">{lead.message}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            상태
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            담당자
            <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="예: 김상담" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            상담 메모 추가
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" />
          </label>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={busy} onClick={save} className="rounded-full bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
            저장
          </button>
          {webhook && (
            <button disabled={busy} onClick={forward} className="rounded-full border-2 border-slate-200 px-5 py-2.5 font-bold hover:border-ink disabled:opacity-50">
              외부 CRM 재전송
            </button>
          )}
        </div>
        {lead.forward && (
          <p className={`mt-3 text-xs ${lead.forward.ok ? 'text-green-700' : 'text-red-600'}`}>
            외부 CRM 전달 {lead.forward.ok ? '성공' : `실패 (${lead.forward.error || lead.forward.status})`} · {fmt(lead.forward.at)}
          </p>
        )}

        <h3 className="mt-8 font-extrabold text-ink">상담 기록</h3>
        <ul className="mt-3 space-y-3">
          {lead.notes.length === 0 && <li className="text-sm text-ink-soft">아직 기록이 없습니다.</li>}
          {[...lead.notes].reverse().map((n) => (
            <li key={n.at} className="rounded-2xl bg-surface p-3 text-sm">
              <p className="text-xs text-ink-soft">
                {fmt(n.at)} · {n.by}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{n.text}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

function ConnectionPanel({ webhook }) {
  const items = [
    ['상담 접수', platform.crmEndpoint === '/api/leads' ? '내장 서버' : '외부 CRM 직접', true],
    ['외부 CRM 전달 (Webhook)', webhook ? '연결됨' : '미연결 — CRM_WEBHOOK_URL', webhook],
    ['학생 LMS', platformLink('lms').ready ? '연결됨' : '미연결 — VITE_LMS_URL', platformLink('lms').ready],
    ['레벨테스트', platformLink('levelTest').ready ? '연결됨' : '미연결 — VITE_LEVEL_TEST_URL', platformLink('levelTest').ready],
    ['유학원 파트너 포털', platformLink('partner').ready ? '연결됨' : '미연결 — VITE_PARTNER_PORTAL_URL', platformLink('partner').ready],
    ['직원 CRM', platform.staffCrmUrl ? '외부 연결됨' : '내장 CRM 사용 중', true],
    ['대학·기업 포털', platformLink('institution').ready ? '연결됨' : '미연결 — VITE_INSTITUTION_PORTAL_URL', platformLink('institution').ready],
  ]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-extrabold text-ink">플랫폼 연결 상태</p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map(([k, v, ok]) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <span>{k}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ok ? 'bg-lime-soft text-ink' : 'bg-slate-100 text-slate-500'}`}>{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-soft">미연결 항목은 사이트에서 ‘오픈 예정’으로 표시되고 상담 신청으로 연결됩니다.</p>
    </div>
  )
}

function AdminPage() {
  const [authed, setAuthed] = useState(Boolean(getToken()))
  const [loginError, setLoginError] = useState('')
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ status: '', type: '', source: '', q: '' })

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([adminApi.leads(), adminApi.stats()])
      setData(d)
      setStats(s)
      setLoginError('')
    } catch (e) {
      if (e.status === 401) {
        setToken('')
        setAuthed(false)
        setLoginError('토큰이 올바르지 않습니다.')
      } else if (e.status === 503) {
        setAuthed(false)
        setLoginError('서버에 ADMIN_TOKEN 이 설정되지 않았습니다.')
      } else {
        setLoginError(`서버에 연결할 수 없습니다. (npm run server 실행 여부 확인) ${e.message}`)
        setAuthed(false)
      }
    }
  }, [])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  const leads = useMemo(() => {
    if (!data) return []
    const q = filter.q.trim().toLowerCase()
    return data.leads.filter((l) => {
      if (filter.status && l.status !== filter.status) return false
      if (filter.type && l.type !== filter.type) return false
      if (filter.source && sourceOf(l)[0] !== filter.source) return false
      if (q && !`${l.name} ${l.org} ${l.phone} ${l.email} ${l.code} ${JSON.stringify(l.attribution)}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, filter])

  if (!authed) {
    return (
      <Login
        error={loginError}
        onLogin={(token) => {
          setToken(token)
          setAuthed(true)
        }}
      />
    )
  }
  if (!data || !stats) return <p className="py-24 text-center text-ink-soft">불러오는 중…</p>

  const onSaved = (lead) => {
    setSelected(lead)
    load()
  }
  const sel = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-brand-600">INTERNAL CRM</p>
            <h1 className="text-3xl font-extrabold text-ink">상담 · 추천 · 파트너 관리</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:border-ink">새로고침</button>
            <button onClick={() => adminApi.downloadCsv()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
              <Icon name="download" className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => {
                setToken('')
                setAuthed(false)
              }}
              className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft hover:text-ink"
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          <StatCard label="전체" value={stats.total} tone="bg-ink [&_p]:text-white" />
          {data.statuses.map((s) => (
            <StatCard key={s} label={STATUS_LABEL[s]} value={stats.byStatus[s] || 0} />
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <CodeTable title="직원 홍보 성과" rows={stats.staff} empty="직원 코드(staff)로 유입된 신청이 없습니다." />
          <CodeTable title="B2B 유학원 성과" rows={stats.partners} empty="파트너 코드(partner)로 유입된 신청이 없습니다." />
          <CodeTable title="학생 추천인" rows={stats.referrers} empty="추천 코드(ref)로 유입된 신청이 없습니다." />
          <Breakdown title="유입 채널" data={stats.byChannel} labels={{ direct: '직접 방문' }} />
          <Breakdown title="신청 유형" data={stats.byType} labels={TYPE_LABEL} />
          <ConnectionPanel webhook={data.webhook} />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
            <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="이름·연락처·코드 검색" className={`${sel} min-w-52 flex-1`} />
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className={sel}>
              <option value="">전체 상태</option>
              {data.statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className={sel}>
              <option value="">전체 유형</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select value={filter.source} onChange={(e) => setFilter({ ...filter, source: e.target.value })} className={sel}>
              <option value="">전체 유입</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-3">신청일</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">유형</th>
                  <th className="px-4 py-3">국가</th>
                  <th className="px-4 py-3">관심 분야</th>
                  <th className="px-4 py-3">유입</th>
                  <th className="px-4 py-3">담당</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-ink-soft">
                      조건에 맞는 신청이 없습니다.
                    </td>
                  </tr>
                )}
                {leads.map((l) => {
                  const [kind, code] = sourceOf(l)
                  return (
                    <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer border-t border-slate-100 hover:bg-brand-50/40">
                      <td className="px-4 py-3 text-ink-soft">{fmt(l.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[l.status]}`}>{STATUS_LABEL[l.status]}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{l.name}</td>
                      <td className="px-4 py-3">{TYPE_LABEL[l.type]}</td>
                      <td className="px-4 py-3">{l.country || '-'}</td>
                      <td className="px-4 py-3">{l.interest || '-'}</td>
                      <td className="px-4 py-3">
                        {SOURCE_LABEL[kind]}
                        {code && <span className="ml-1 font-mono text-xs text-brand-700">{code}</span>}
                      </td>
                      <td className="px-4 py-3">{l.assignee || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected && (
        <LeadDetail key={selected.id + selected.updatedAt} lead={selected} statuses={data.statuses} webhook={data.webhook} onClose={() => setSelected(null)} onSaved={onSaved} />
      )}
    </div>
  )
}

export default AdminPage
