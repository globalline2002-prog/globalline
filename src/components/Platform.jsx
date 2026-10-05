import { useLang } from '../lang'
import Icon from './Icon'
import { CheckItem, SectionHead } from './Ui'

export function PlatformFlow({ dark = false }) {
  const { c } = useLang()
  return (
    <ol className="grid gap-4 md:grid-cols-5">
      {c.platform.flow.map(([step, title, desc], i) => (
        <li
          key={step}
          className={`relative rounded-3xl p-5 ${dark ? 'bg-white/5 ring-1 ring-white/10' : 'border border-slate-200 bg-white'}`}
        >
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
              i === 1 || i === 2 ? 'bg-lime-brand text-ink' : dark ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-700'
            }`}
          >
            {step}
          </span>
          <p className={`mt-3 font-extrabold ${dark ? 'text-white' : 'text-ink'}`}>{title}</p>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-ink-soft'}`}>{desc}</p>
          {i < 4 && (
            <Icon
              name="arrow"
              className={`absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 md:block ${dark ? 'text-lime-brand' : 'text-brand-600'}`}
              strokeWidth={2.5}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

function PlatformSection() {
  const { c } = useLang()
  const p = c.platform
  return (
    <section id="platform" className="scroll-mt-32 bg-ink py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <span className="text-sm font-bold tracking-wider text-lime-brand">{p.eyebrow}</span>
        <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">{p.title}</h2>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">{p.desc}</p>
        <div className="mt-12">
          <PlatformFlow dark />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            [p.crmTitle, p.crmFeatures, 'users'],
            [p.lmsTitle, p.lmsFeatures, 'book'],
          ].map(([title, list, icon]) => (
            <div key={title} className="rounded-3xl bg-white p-7 text-ink">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <Icon name={icon} />
                </span>
                <h3 className="text-xl font-extrabold">{title}</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {list.map((f) => (
                  <CheckItem key={f}>{f}</CheckItem>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PlatformTeaser() {
  const { c } = useLang()
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={c.platform.eyebrow} title={c.platform.title} desc={c.platform.desc} />
        <div className="mt-10">
          <PlatformFlow />
        </div>
      </div>
    </section>
  )
}

export default PlatformSection
