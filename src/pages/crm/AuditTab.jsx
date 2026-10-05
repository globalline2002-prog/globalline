import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/crmApi'
import { ErrorText } from './shared'
import { ACTION_LABEL, ROLE_LABEL, btnGhost, fmt } from './labels'

function AuditTab() {
  const [entries, setEntries] = useState(null)
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ userId: '', action: '' })
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.audit({ ...filter, limit: 300 }).then((r) => setEntries(r.entries), (e) => setError(e.message))
  }, [filter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    api.users().then((r) => setUsers(r.users), () => {})
  }, [])

  const sel = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'
  const target = (e) => {
    if (e.leadId) return `신청 ${e.leadId.slice(0, 8)}`
    if (e.targetUsername) return `계정 ${e.targetUsername}`
    if (typeof e.count === 'number') return `${e.count}건`
    return ''
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">
        누가 언제 어떤 신청을 열람·수정·내보냈는지, 로그인과 계정 변경까지 모두 기록됩니다. 기록은 수정·삭제할 수 없습니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <select value={filter.userId} onChange={(e) => setFilter({ ...filter, userId: e.target.value })} className={sel}>
          <option value="">전체 사용자</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.username})
            </option>
          ))}
        </select>
        <select value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} className={sel}>
          <option value="">전체 활동</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button onClick={load} className={btnGhost}>
          새로고침
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">일시</th>
              <th className="px-4 py-3">사용자</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">활동</th>
              <th className="px-4 py-3">대상</th>
              <th className="px-4 py-3">내용</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {!entries && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">
                  불러오는 중…
                </td>
              </tr>
            )}
            {entries?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">
                  기록이 없습니다.
                </td>
              </tr>
            )}
            {entries?.map((e, i) => (
              <tr key={i} className={`border-t border-slate-100 ${/failed|blocked|denied/.test(e.action) ? 'bg-red-50/60' : ''}`}>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">{fmt(e.at)}</td>
                <td className="px-4 py-2.5 font-semibold">{e.username || '-'}</td>
                <td className="px-4 py-2.5">{ROLE_LABEL[e.role] || e.role || '-'}</td>
                <td className="px-4 py-2.5">{ACTION_LABEL[e.action] || e.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{target(e)}</td>
                <td className="px-4 py-2.5 text-xs text-ink-soft">{e.changes?.join(', ')}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">{e.ip || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditTab
