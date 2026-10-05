import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/crmApi'
import { Card, ErrorText } from './shared'
import { ROLE_LABEL, btnGhost, btnPrimary, fmt, input } from './labels'

const EMPTY = { username: '', name: '', role: 'staff', code: '', password: '' }

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => chars[b % chars.length]).join('')
}

const ROLE_HELP = {
  admin: '모든 신청·계정·열람 기록 관리',
  staff: '배정된 학생만 조회·수정. 코드를 넣으면 그 코드의 홍보 링크로 들어온 신청이 자동 배정됩니다.',
  partner: '파트너 코드로 유입되거나 직접 등록한 학생만 조회 (읽기 전용)',
}

function UserForm({ initial, onSubmit, onCancel, isNew, isSelf }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [issued, setIssued] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(form)
      if (form.password) setIssued(form.password)
      else onCancel()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (issued) {
    return (
      <div className="rounded-2xl bg-lime-soft p-4 text-sm">
        <p className="font-bold">{isNew ? '계정을 만들었습니다.' : '비밀번호를 재설정했습니다.'} 아래 임시 비밀번호를 본인에게만 전달하세요.</p>
        <p className="mt-2 font-mono text-lg font-bold">{issued}</p>
        <p className="mt-1 text-ink-soft">첫 로그인 시 비밀번호를 바꾸도록 안내됩니다. 이 화면을 닫으면 다시 볼 수 없습니다.</p>
        <button onClick={onCancel} className={`${btnPrimary} mt-3`}>
          확인
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold">
        아이디
        <input value={form.username} onChange={set('username')} disabled={!isNew} placeholder="예: kim.sd" className={`${input} mt-1 disabled:bg-slate-50`} />
      </label>
      <label className="text-sm font-bold">
        이름
        <input value={form.name} onChange={set('name')} placeholder="예: 김상담 / Hanoi Study Center" className={`${input} mt-1`} />
      </label>
      <label className="text-sm font-bold">
        역할
        <select value={form.role} onChange={set('role')} disabled={isSelf} className={`${input} mt-1`}>
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        {form.role === 'partner' ? '파트너 코드 (필수)' : form.role === 'staff' ? '직원 홍보 코드 (선택)' : '코드 (선택)'}
        <input value={form.code} onChange={set('code')} placeholder={form.role === 'partner' ? '예: VN-HANOI' : '예: ST-KIM01'} className={`${input} mt-1 uppercase`} />
      </label>
      <p className="text-xs text-ink-soft sm:col-span-2">{ROLE_HELP[form.role]}</p>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <label className="flex-1 text-sm font-bold">
          {isNew ? '임시 비밀번호' : '비밀번호 재설정 (변경할 때만)'}
          <input value={form.password} onChange={set('password')} className={`${input} mt-1 font-mono`} />
        </label>
        <button type="button" onClick={() => setForm({ ...form, password: randomPassword() })} className={btnGhost}>
          자동 생성
        </button>
      </div>
      {!isNew && !isSelf && (
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
          <input type="checkbox" checked={form.active} onChange={set('active')} className="h-4 w-4 accent-brand-600" />
          계정 사용 (해제하면 즉시 로그아웃되고 로그인할 수 없습니다)
        </label>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className={btnPrimary}>
          {isNew ? '계정 만들기' : '저장'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          취소
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  )
}

function UsersTab({ me }) {
  const [users, setUsers] = useState(null)
  const [editing, setEditing] = useState(null) // 'new' | user
  const [error, setError] = useState('')

  const load = useCallback(() => api.users().then((r) => setUsers(r.users), (e) => setError(e.message)), [])
  useEffect(() => {
    load()
  }, [load])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!users) return <p className="py-10 text-center text-ink-soft">불러오는 중…</p>

  const save = async (form) => {
    if (editing === 'new') await api.createUser(form)
    else {
      const { username: _u, password, ...rest } = form
      await api.updateUser(editing.id, password ? { ...rest, password } : rest)
    }
    load()
  }

  return (
    <div className="space-y-4">
      <Card
        title={editing === 'new' ? '새 계정' : editing ? `계정 수정 · ${editing.username}` : '계정 관리'}
        right={!editing && <button onClick={() => setEditing('new')} className={btnPrimary}>+ 계정 추가</button>}
      >
        {editing ? (
          <UserForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? { ...EMPTY, password: randomPassword() } : { ...editing, password: '' }}
            isNew={editing === 'new'}
            isSelf={editing !== 'new' && editing.id === me.id}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <p className="text-sm text-ink-soft">직원·유학원 계정을 만들고 역할을 정합니다. 역할·코드·비밀번호를 바꾸거나 계정을 끄면 해당 사용자는 즉시 로그아웃됩니다.</p>
        )}
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">아이디</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">코드</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">최근 로그인</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono">{u.username}</td>
                <td className="px-4 py-3 font-semibold">
                  {u.name}
                  {u.id === me.id && <span className="ml-1 text-xs text-brand-600">(나)</span>}
                </td>
                <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.code || '-'}</td>
                <td className="px-4 py-3">
                  {u.active ? (u.mustChangePassword ? <span className="text-amber-700">비밀번호 변경 대기</span> : '사용') : <span className="text-slate-400">중지</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{fmt(u.lastLoginAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(u)} className="text-sm font-bold text-brand-600 hover:underline">
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UsersTab
