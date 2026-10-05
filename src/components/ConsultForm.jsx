import { useEffect, useState } from 'react'
import { platform } from '../config'
import { languages, useLang } from '../lang'
import { getAttribution, submitLead } from '../lib/crm'
import { PREFILL_EVENT, takePrefill } from '../lib/prefill'
import Icon from './Icon'

const TYPES = ['student', 'partner', 'university', 'company']

const field =
  'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

function initialForm() {
  const attr = getAttribution()
  return {
    type: 'student',
    name: '',
    org: '',
    country: '',
    phone: '',
    email: '',
    contactPref: '',
    interest: '',
    message: '',
    code: attr.ref || attr.staff || attr.partner || '',
    consent: false,
    website: '', // 스팸 방지용 숨김 필드
  }
}

function ConsultForm() {
  const { c, lang } = useLang()
  const t = c.consult
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')
  const attr = getAttribution()
  const hasAttrCode = Boolean(attr.ref || attr.staff || attr.partner)

  // 과정 찾기·파트너 버튼 등에서 넘어온 값을 채웁니다.
  useEffect(() => {
    const apply = () => {
      const pre = takePrefill()
      if (!pre) return
      setForm((f) => ({ ...f, ...pre }))
      setStatus('idle')
      document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' })
    }
    apply()
    window.addEventListener(PREFILL_EVENT, apply)
    return () => window.removeEventListener(PREFILL_EVENT, apply)
  }, [])

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.website) return
    if (!form.name.trim() || !(form.phone.trim() || form.email.trim()) || !form.consent) {
      setError(t.required)
      return
    }
    setError('')
    setStatus('sending')
    try {
      const { website: _honeypot, consent, ...rest } = form
      await submitLead({
        ...rest,
        consent: consent ? new Date().toISOString() : null,
        preferredLanguage: languages.find((l) => l.code === lang)?.label,
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-brand text-ink">
          <Icon name="check" className="h-8 w-8" strokeWidth={3} />
        </span>
        <p className="mt-5 text-xl font-extrabold text-ink">{t.success}</p>
        <button
          onClick={() => {
            setForm(initialForm())
            setStatus('idle')
          }}
          className="mt-6 rounded-full border-2 border-ink/80 px-6 py-3 font-bold hover:bg-ink hover:text-white"
        >
          {t.again}
        </button>
      </div>
    )
  }

  const isStudent = form.type === 'student'

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <fieldset>
        <legend className="text-sm font-bold text-ink">{t.typeLabel}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setForm((f) => ({ ...f, type, interest: '' }))}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold transition ${
                form.type === type ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft hover:border-slate-300'
              }`}
            >
              {t.types[type]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink">
          {t.name} *
          <input value={form.name} onChange={set('name')} className={field} autoComplete="name" />
        </label>
        {isStudent ? (
          <label className="text-sm font-bold text-ink">
            {t.country}
            <select value={form.country} onChange={set('country')} className={field}>
              <option value="">-</option>
              {t.countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-sm font-bold text-ink">
            {t.org}
            <input value={form.org} onChange={set('org')} className={field} autoComplete="organization" />
          </label>
        )}
        <label className="text-sm font-bold text-ink">
          {t.phone} *
          <input value={form.phone} onChange={set('phone')} className={field} autoComplete="tel" />
        </label>
        <label className="text-sm font-bold text-ink">
          {t.email}
          <input type="email" value={form.email} onChange={set('email')} className={field} autoComplete="email" />
        </label>
        <label className="text-sm font-bold text-ink">
          {t.contactPref}
          <select value={form.contactPref} onChange={set('contactPref')} className={field}>
            <option value="">-</option>
            {t.contactPrefs.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          {t.interest}
          <select value={form.interest} onChange={set('interest')} className={field}>
            <option value="">-</option>
            {t.interests[form.type].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {!isStudent && (
          <label className="text-sm font-bold text-ink">
            {t.country}
            <select value={form.country} onChange={set('country')} className={field}>
              <option value="">-</option>
              {t.countries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-bold text-ink">
          {t.refCode}
          <input value={form.code} onChange={set('code')} className={field} />
          {hasAttrCode && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
              {t.refApplied}
            </span>
          )}
        </label>
        <label className="text-sm font-bold text-ink sm:col-span-2">
          {t.message}
          <textarea value={form.message} onChange={set('message')} rows={4} placeholder={t.messagePh} className={`${field} resize-y font-normal`} />
        </label>
        <input type="text" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-4 w-4 accent-brand-600" />
        <span>{t.consent} *</span>
      </label>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
      {status === 'error' && (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {t.error}{' '}
          <a href={`mailto:${platform.contactEmail}`} className="underline">
            {platform.contactEmail}
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
      >
        {status === 'sending' ? t.sending : t.submit}
        {status !== 'sending' && <Icon name="arrow" className="h-5 w-5" />}
      </button>
    </form>
  )
}

export default ConsultForm
