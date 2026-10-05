import { CourseCards } from '../components/Courses'
import CtaBand from '../components/CtaBand'
import Hero from '../components/Hero'
import Icon from '../components/Icon'
import { PlatformTeaser } from '../components/Platform'
import { SectionHead } from '../components/Ui'
import { useLang } from '../lang'
import { href } from '../router'

const audienceIcons = ['users', 'globe', 'building', 'briefcase']
const growIcons = ['share', 'chart', 'globe']

function HomePage() {
  const { c } = useLang()
  const h = c.home
  return (
    <>
      <Hero />

      <section id="audiences" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead title={h.audienceTitle} desc={h.audienceDesc} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {h.audiences.map((a, i) => (
              <a key={a.title} href={href(a.route)} className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-600 hover:shadow-lg">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-soft text-ink">
                  <Icon name={audienceIcons[i]} className="h-6 w-6" />
                </span>
                <p className="mt-4 text-lg font-extrabold text-ink">{a.title}</p>
                <p className="mt-2 text-sm text-ink-soft">{a.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                  {c.ui.more}
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead title={h.pathTitle} desc={h.pathDesc} />
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {h.path.map((p) => (
              <li key={p.step}>
                <a href={href(p.route)} className="group flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <span className="text-sm font-extrabold text-brand-600">STEP {p.step}</span>
                  <p className="mt-2 text-xl font-extrabold text-ink">{p.title}</p>
                  <p className="mt-2 flex-1 text-sm text-ink-soft">{p.desc}</p>
                  <Icon name="arrow" className="mt-4 h-5 w-5 text-brand-600 transition group-hover:translate-x-1" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead eyebrow={c.courses.eyebrow} title={c.courses.title} />
            <a href={href('pre-departure/compare')} className="inline-flex items-center gap-1 font-bold text-brand-600 hover:underline">
              {c.hero.ctaCompare}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10">
            <CourseCards compact />
          </div>
        </div>
      </section>

      <div className="bg-surface">
        <PlatformTeaser />
      </div>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead title={h.growTitle} desc={h.growDesc} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {h.grow.map((g, i) => (
              <a key={g.title} href={href(g.route)} className="group flex items-center gap-4 rounded-3xl bg-ink p-6 text-white transition hover:bg-brand-700">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-brand text-ink">
                  <Icon name={growIcons[i]} className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-lg font-extrabold">{g.title}</span>
                  <span className="mt-1 block text-sm text-slate-300">{g.desc}</span>
                </span>
                <Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-ink">{c.news.noticeTitle}</h2>
            <a href={href('news')} className="inline-flex items-center gap-1 text-sm font-bold text-brand-600">
              {c.ui.more}
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
          <ul className="mt-6 divide-y divide-slate-100 rounded-3xl border border-slate-200">
            {c.news.items.slice(0, 3).map((n) => (
              <li key={n.title}>
                <a href={href('news/notice')} className="flex flex-col gap-1 px-6 py-4 hover:bg-surface sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{n.tag}</span>
                  <span className="flex-1 font-semibold text-ink">{n.title}</span>
                  <span className="text-sm text-ink-soft">{n.date}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  )
}

export default HomePage
