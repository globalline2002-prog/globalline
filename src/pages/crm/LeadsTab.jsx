import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import { api } from '../../lib/crmApi'
import { Card, ConnectionPanel, ErrorText, StatusBadge } from './shared'
import { ACTION_LABEL, SOURCE_LABEL, STATUS_LABEL, TYPE_LABEL, btnGhost, btnPrimary, fmt, input } from './labels'

function StatCard({ label, value, dark }) {
  return (
    <div className={`rounded-2xl border border-slate-200 p-4 ${dark ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
      <p className={`text-xs font-bold ${dark ? 'text-slate-300' : 'text-ink-soft'}`}>{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  )
}

function CodeTable({ title, rows, empty }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">{empty}</p>
      ) : (
        <table className="w-full text-sm">
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
    </Card>
  )
}

function Breakdown({ title, data, labels = {} }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...entries.map(([, v]) => v))
  return (
    <Card title={title}>
      <ul className="space-y-2 text-sm">
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
    </Card>
  )
}

function LeadDetail({ id, me, statuses, staff, webhook, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ status: '', assigneeId: '', note: '' })
  const [history, setHistory] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const apply = useCallback((d) => {
    setData(d)
    setForm({ status: d.lead.status, assigneeId: d.lead.assigneeId || '', note: '' })
  }, [])

  // 상세를 열 때마다 서버에서 다시 받아 '상세 열람'이 기록됩니다.
  useEffect(() => {
    api.lead(id).then(apply, (e) => setError(e.message))
    if (me.role === 'admin') api.leadAudit(id).then((r) => setHistory(r.entries), () => {})
  }, [id, me.role, apply])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      apply(await fn())
      onChanged()
      if (me.role === 'admin') setHistory((await api.leadAudit(id)).entries)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const lead = data?.lead
  const rows = lead && [
    ['신청 유형', TYPE_LABEL[lead.type]],
    ['기관·회사', lead.org],
    ['국가', lead.country],
    ['연락처', lead.phone],
    ['이메일', lead.email],
    ['선호 연락', lead.contactPref],
    ['관심 분야', lead.interest],
    ['과정 찾기 결과', lead.finder],
    ['상담 언어', lead.preferredLanguage],
    ['유입', [lead.attribution?.staff && `직원 ${lead.attribution.staff}`, lead.attribution?.partner && `유학원 ${lead.attribution.partner}`, lead.attribution?.ref && `추천인 ${lead.attribution.ref}`, lead.attribution?.utm_source].filter(Boolean).join(' · ')],
    ['담당 직원', lead.assignee],
    ['신청일', fmt(lead.createdAt)],
    ['개인정보 동의', fmt(lead.consentAt)],
  ]

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40" onClick={onClose}>
      <aside className="ml-auto h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600">{lead ? TYPE_LABEL[lead.type] : ''}</p>
            <h2 className="text-2xl font-extrabold text-ink">{lead?.name || '불러오는 중…'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <ErrorText>{error}</ErrorText>

        {lead && (
          <>
            <div className="mt-2">
              <StatusBadge status={lead.status} />
            </div>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2">
                  <dt className="w-28 shrink-0 text-ink-soft">{k}</dt>
                  <dd className="font-medium text-ink">{v || '-'}</dd>
                </div>
              ))}
            </dl>
            {lead.message && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface p-4 text-sm">{lead.message}</p>}

            {data.canEdit ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  상태
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${input} mt-1`}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </label>
                {me.role === 'admin' && (
                  <label className="text-sm font-bold">
                    담당 직원 배정
                    <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className={`${input} mt-1`}>
                      <option value="">미배정</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.username})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="text-sm font-bold sm:col-span-2">
                  상담 메모 추가
                  <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className={`${input} mt-1`} />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    disabled={busy}
                    onClick={() => run(() => api.updateLead(id, me.role === 'admin' ? form : { status: form.status, note: form.note }))}
                    className={btnPrimary}
                  >
                    저장
                  </button>
                  {me.role === 'admin' && webhook && (
                    <button disabled={busy} onClick={() => run(() => api.forward(id))} className={btnGhost}>
                      외부 CRM 재전송
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-2xl bg-lime-soft px-4 py-3 text-sm">
                {me.role === 'partner' ? '유학원 계정은 진행 상황만 확인할 수 있습니다. 변경이 필요하면 담당자에게 요청하세요.' : '배정된 담당자만 수정할 수 있습니다.'}
              </p>
            )}

            {lead.forward && me.role === 'admin' && (
              <p className={`mt-3 text-xs ${lead.forward.ok ? 'text-green-700' : 'text-red-600'}`}>
                외부 CRM 전달 {lead.forward.ok ? '성공' : `실패 (${lead.forward.error || lead.forward.status})`} · {fmt(lead.forward.at)}
              </p>
            )}

            {lead.notes && (
              <>
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
              </>
            )}

            {history && (
              <>
                <h3 className="mt-8 font-extrabold text-ink">열람 기록</h3>
                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {history.map((e, i) => (
                    <li key={i} className="flex justify-between gap-3 py-2">
                      <span>
                        <span className="font-semibold">{e.username}</span> · {ACTION_LABEL[e.action] || e.action}
                        {e.changes && <span className="text-ink-soft"> ({e.changes.join(', ')})</span>}
                      </span>
                      <span className="shrink-0 text-xs text-ink-soft">{fmt(e.at)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

function LeadsTab({ me }) {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ status: '', type: '', source: '', q: '' })

  const load = useCallback(async () => {
    try {
      const [d, s] = await Promise.all([api.leads(), api.stats()])
      setData(d)
      setStats(s)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const leads = useMemo(() => {
    if (!data) return []
    const q = filter.q.trim().toLowerCase()
    return data.leads.filter((l) => {
      if (filter.status && l.status !== filter.status) return false
      if (filter.type && l.type !== filter.type) return false
      if (filter.source && l.sourceKind !== filter.source) return false
      if (q && !`${l.name} ${l.org} ${l.sourceCode} ${l.assignee}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, filter])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!data || !stats) return <p className="py-10 text-center text-ink-soft">불러오는 중…</p>

  const sel = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
  const scopeNote = {
    admin: '전체 신청을 볼 수 있습니다.',
    staff: '나에게 배정된 학생만 표시됩니다.',
    partner: `파트너 코드 ${me.code}로 유입되었거나 직접 등록한 학생만 표시됩니다. (읽기 전용)`,
  }[me.role]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{scopeNote}</p>
        <div className="flex gap-2">
          <button onClick={load} className={btnGhost}>
            새로고침
          </button>
          {me.role !== 'partner' && (
            <button onClick={() => api.downloadCsv().then(load)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
              <Icon name="download" className="h-4 w-4" /> CSV
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
        <StatCard label="전체" value={stats.total} dark />
        {data.statuses.map((s) => (
          <StatCard key={s} label={STATUS_LABEL[s]} value={stats.byStatus[s] || 0} />
        ))}
      </div>

      {me.role === 'admin' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <CodeTable title="직원 홍보 성과" rows={stats.staff} empty="직원 코드로 유입된 신청이 없습니다." />
          <CodeTable title="B2B 유학원 성과" rows={stats.partners} empty="파트너 코드로 유입된 신청이 없습니다." />
          <CodeTable title="학생 추천인" rows={stats.referrers} empty="추천 코드로 유입된 신청이 없습니다." />
          <Breakdown title="유입 채널" data={stats.byChannel} labels={{ direct: '직접 방문' }} />
          <Breakdown title="신청 유형" data={stats.byType} labels={TYPE_LABEL} />
          <ConnectionPanel webhook={data.webhook} />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="이름·기관·코드·담당자 검색" className={`${sel} min-w-52 flex-1`} />
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
          {me.role === 'admin' && (
            <select value={filter.source} onChange={(e) => setFilter({ ...filter, source: e.target.value })} className={sel}>
              <option value="">전체 유입</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-ink-soft">
              <tr>
                <th className="px-4 py-3">신청일</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">국가</th>
                <th className="px-4 py-3">관심 분야</th>
                <th className="px-4 py-3">유입</th>
                {me.role !== 'partner' && <th className="px-4 py-3">담당</th>}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-soft">
                    표시할 신청이 없습니다.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} onClick={() => setSelected(l.id)} className="cursor-pointer border-t border-slate-100 hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-ink-soft">{fmt(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 font-semibold">{l.name}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[l.type]}</td>
                  <td className="px-4 py-3">{l.country || '-'}</td>
                  <td className="px-4 py-3">{l.interest || '-'}</td>
                  <td className="px-4 py-3">
                    {SOURCE_LABEL[l.sourceKind]}
                    {l.sourceCode && <span className="ml-1 font-mono text-xs text-brand-700">{l.sourceCode}</span>}
                  </td>
                  {me.role !== 'partner' && <td className="px-4 py-3">{l.assignee || <span className="text-ink-soft">미배정</span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <LeadDetail
          key={selected}
          id={selected}
          me={me}
          statuses={data.statuses}
          staff={data.staff}
          webhook={data.webhook}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </>
  )
}

export default LeadsTab
