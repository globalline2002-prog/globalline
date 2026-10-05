import { languages, useLang } from '../lang'
import { href } from '../router'
import Icon from './Icon'

function Hero() {
  const { c } = useLang()
  const h = c.hero
  const chips = [languages.map((l) => l.label).join(' · '), ...h.chips]

  return (
    <section className="overflow-hidden bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold tracking-wider text-brand-600">
            <Icon name="cap" className="h-4 w-4" />
            {h.badge}
          </span>
          <h1 className="mt-7 text-[2.6rem] font-extrabold leading-[1.15] tracking-tight text-ink sm:text-6xl">
            {h.title1}
            <br />
            <span className="text-brand-600">{h.title2}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">{h.desc}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={href('consult/form')}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-4 font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
            >
              {h.ctaConsult}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <a
              href={href('pre-departure/compare')}
              className="inline-flex items-center rounded-full border-2 border-ink/80 bg-white px-6 py-4 font-bold text-ink transition hover:bg-ink hover:text-white"
            >
              {h.ctaCompare}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {chips.map((chip) => (
              <li key={chip} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink-soft">
                <Icon name="check" className="h-4 w-4 text-brand-600" strokeWidth={2.5} />
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative pb-16 pr-3 pt-3 sm:pr-4 sm:pt-4">
          <div className="absolute inset-0 bottom-12 left-10 rounded-[2.5rem] bg-lime-brand" />
          <img
            src="/images/hero-students.webp"
            alt=""
            className="relative aspect-[6/5] w-full rounded-[2rem] object-cover shadow-xl"
          />
          <div className="absolute bottom-0 left-4 right-8 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-xl sm:left-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-ink">
              <Icon name="cap" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-extrabold text-ink">{h.cardTitle}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{h.cardSub}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
