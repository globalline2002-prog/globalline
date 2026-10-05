import { useState } from 'react'
import { api } from '../../lib/crmApi'
import { ErrorText } from './shared'
import { btnPrimary, input } from './labels'

const INTERESTS = ['입국 전 한국어 48시간', '입국 전 한국어 80시간', '입국 전 한국어 200시간', 'D-4 어학연수', 'D-2 학부·대학원', '취업·창업·정착']
const EMPTY = { name: '', country: '', phone: '', email: '', interest: '', message: '', consent: false }

// 유학원 계정: 모집한 학생을 직접 등록 (파트너 코드는 서버에서 자동으로 붙습니다)
function RegisterTab({ me, onDone }) {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !(form.phone.trim() || form.email.trim()) || !form.consent) {
      setError('이름, 연락처(전화 또는 이메일), 학생 동의 확인은 필수입니다.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.registerLead({ ...form, type: 'student', consent: new Date().toISOString() })
      setForm(EMPTY)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-lime-soft p-6">
        <p className="font-bold">학생을 등록했습니다. Global C&B 담당자가 배정되면 ‘내 학생’ 목록에서 진행 상황을 확인할 수 있습니다.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setDone(false)} className={btnPrimary}>
            한 명 더 등록
          </button>
          <button onClick={onDone} className="rounded-full px-4 py-2 text-sm font-bold text-brand-600">
            내 학생 보기
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-ink-soft">
        등록한 학생에는 파트너 코드 <span className="font-mono font-bold text-brand-700">{me.code}</span>가 자동으로 붙어 수수료 정산 근거로 집계됩니다.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          학생 이름 *
          <input value={form.name} onChange={set('name')} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-bold">
          국가
          <input value={form.country} onChange={set('country')} placeholder="예: 베트남" className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-bold">
          연락처 *
          <input value={form.phone} onChange={set('phone')} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-bold">
          이메일
          <input type="email" value={form.email} onChange={set('email')} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          관심 과정
          <select value={form.interest} onChange={set('interest')} className={`${input} mt-1`}>
            <option value="">-</option>
            {INTERESTS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          메모 (한국어 수준, 희망 입국 시기 등)
          <textarea value={form.message} onChange={set('message')} rows={3} className={`${input} mt-1`} />
        </label>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 accent-brand-600" />
        <span>학생(미성년자는 보호자)에게 상담 목적의 개인정보 제공 동의를 받았습니다. *</span>
      </label>
      <ErrorText>{error}</ErrorText>
      <button disabled={busy} className={`${btnPrimary} mt-5`}>
        학생 등록
      </button>
    </form>
  )
}

export default RegisterTab
