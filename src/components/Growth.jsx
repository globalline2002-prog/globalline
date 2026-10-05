import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { linkProps, platformLink } from '../config'
import { useLang } from '../lang'
import { buildTrackingLink } from '../lib/crm'
import { setPrefill } from '../lib/prefill'
import { href } from '../router'
import Icon from './Icon'
import { CheckItem, SectionHead } from './Ui'

const portalIcons = { lms: 'book', partner: 'globe', staff: 'chart', institution: 'building' }

export function Portals() {
  const { c } = useLang()
  const p = c.portals
  return (
    <section id="portals" className="scroll-mt-32 bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={p.eyebrow} title={p.title} desc={p.desc} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {p.items.map((it) => {
            const link = platformLink(it.key)
            return (
              <a
                key={it.key}
                {...linkProps(link)}
                className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-600 hover:shadow-lg"
              >
                {!link.ready && (
                  <span className="absolute right-5 top-5 rounded-full bg-lime-soft px-2.5 py-1 text-xs font-bold text-ink">{c.ui.comingSoon}</span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon name={portalIcons[it.key]} className="h-6 w-6" />
                </span>
                <p className="mt-4 text-lg font-extrabold text-ink">{it.title}</p>
                <p className="mt-2 flex-1 text-sm text-ink-soft">{it.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-brand-600">
                  {link.ready ? it.cta : c.ui.comingSoonCta}
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Referral() {
  const { c } = useLang()
  const r = c.referral
  return (
    <section id="referral" className="scroll-mt-32 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={r.eyebrow} title={r.title} desc={r.desc} />
        <ol className="mt-10 grid gap-5 md:grid-cols-4">
          {r.steps.map(([title, desc], i) => (
            <li key={title} className="rounded-3xl border border-slate-200 bg-white p-6">
              <span className="text-4xl font-extrabold text-lime-deep">0{i + 1}</span>
              <p className="mt-3 text-lg font-extrabold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-ink-soft">* {r.note}</p>
      </div>
    </section>
  )
}

export function LinkGenerator() {
  const { c, lang } = useLang()
  const g = c.linkGen
  const [role, setRole] = useState('ref')
  const [code, setCode] = useState('')
  const [channel, setChannel] = useState('kakao')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')

  const clean = code.replace(/[^\w-]/g, '').toUpperCase()
  const link = clean ? buildTrackingLink({ role, code: clean, channel, campaign, lang }) : ''

  useEffect(() => {
    if (!link) return
    let alive = true
    QRCode.toDataURL(link, { width: 360, margin: 1, color: { dark: '#1d2233' } }).then((url) => alive && setQr(url))
    return () => {
      alive = false
    }
  }, [link])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt(g.copy, link)
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Global C&B', text: g.shareText, url: link })
      } catch {
        // 사용자가 취소
      }
    } else {
      copy()
    }
  }

  const field = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500'

  return (
    <section id="share-link" className="scroll-mt-32 px-4 py-4 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-ink p-6 text-white sm:p-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-brand px-3 py-1 text-xs font-extrabold text-ink">
            <Icon name="link" className="h-3.5 w-3.5" /> LINK · QR
          </span>
          <h3 className="mt-4 text-3xl font-extrabold">{g.title}</h3>
          <p className="mt-3 text-slate-300">{g.desc}</p>

          <div className="mt-6 space-y-4 text-sm font-bold">
            <div>
              {g.roleLabel}
              <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {Object.entries(g.roles).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRole(key)}
                    className={`rounded-2xl border-2 px-3 py-2.5 transition ${role === key ? 'border-lime-brand bg-lime-brand text-ink' : 'border-white/20 hover:border-white/50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              {g.codeLabel}
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={g.codePh} maxLength={32} className={`${field} text-ink`} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                {g.channelLabel}
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className={`${field} text-ink`}>
                  {Object.entries(g.channels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {g.campaignLabel}
                <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder={g.campaignPh} maxLength={40} className={`${field} text-ink`} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-white p-6 text-ink">
          <p className="text-sm font-bold text-brand-600">{g.result}</p>
          {link ? (
            <>
              <p className="mt-2 break-all rounded-2xl bg-surface p-4 font-mono text-sm">{link}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700">
                  <Icon name="copy" className="h-4 w-4" />
                  {copied ? g.copied : g.copy}
                </button>
                <button onClick={share} className="inline-flex items-center gap-2 rounded-full border-2 border-ink/80 px-5 py-2.5 font-bold hover:bg-ink hover:text-white">
                  <Icon name="share" className="h-4 w-4" />
                  {g.share}
                </button>
                {qr && (
                  <a href={qr} download={`globalcnb-${clean}.png`} className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-5 py-2.5 font-bold hover:border-ink">
                    <Icon name="download" className="h-4 w-4" />
                    {g.downloadQr}
                  </a>
                )}
              </div>
              {qr && <img src={qr} alt="QR" className="mx-auto mt-6 h-44 w-44" />}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-ink-soft">
              {g.empty}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function Sales() {
  const { c } = useLang()
  const s = c.sales
  const icons = ['link', 'globe', 'users', 'chart']
  return (
    <section id="sales" className="scroll-mt-32 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={s.eyebrow} title={s.title} desc={s.desc} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {s.tools.map(([title, desc], i) => (
            <div key={title} className="rounded-3xl bg-surface p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                <Icon name={icons[i]} />
              </span>
              <p className="mt-4 text-lg font-extrabold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>
        <a {...linkProps(platformLink('staff'))} className="mt-8 inline-flex items-center gap-2 font-bold text-brand-600 hover:underline">
          {c.portals.items[2].cta}
          <Icon name="arrow" className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}

export function Partners() {
  const { c } = useLang()
  const p = c.partners
  return (
    <section id="partners" className="scroll-mt-32 bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={p.eyebrow} title={p.title} desc={p.desc} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {p.benefits.map(([title, desc]) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <span className="h-2.5 w-2.5 rounded-full bg-lime-deep" />
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-14 text-2xl font-extrabold text-ink">{p.stepsTitle}</h3>
        <ol className="mt-6 flex flex-col gap-3 md:flex-row">
          {p.steps.map((step, i) => (
            <li key={step} className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-4 font-bold text-ink shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm text-white">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={href('consult/form')}
            onClick={() => setPrefill({ type: 'partner', interest: c.consult.interests.partner[0] })}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 font-bold text-white hover:bg-brand-700"
          >
            {p.cta}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
          {platformLink('partner').ready && (
            <a {...linkProps(platformLink('partner'))} className="inline-flex items-center rounded-full border-2 border-ink/80 px-6 py-3.5 font-bold hover:bg-ink hover:text-white">
              {c.portals.items[1].cta}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export function Institutions() {
  const { c } = useLang()
  const s = c.institutions
  const types = ['university', 'company']
  return (
    <section id="institutions" className="scroll-mt-32 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={s.eyebrow} title={s.title} desc={s.desc} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {s.items.map((it, i) => (
            <div key={it.title} className="flex flex-col rounded-[2rem] border border-slate-200 p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-soft text-ink">
                <Icon name={i === 0 ? 'building' : 'briefcase'} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-extrabold text-ink">{it.title}</h3>
              <p className="mt-2 text-ink-soft">{it.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {it.points.map((p) => (
                  <CheckItem key={p}>{p}</CheckItem>
                ))}
              </ul>
              <a
                href={href('consult/form')}
                onClick={() => setPrefill({ type: types[i] })}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white hover:bg-brand-700"
              >
                {it.cta}
                <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
