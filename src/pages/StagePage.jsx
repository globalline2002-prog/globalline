import CtaBand from '../components/CtaBand'
import Icon from '../components/Icon'
import { CheckItem, PageHeader } from '../components/Ui'
import { useLang } from '../lang'
import { href } from '../router'

const order = ['pre-departure', 'd4', 'd2', 'career']

function StagePage({ stage }) {
  const { c } = useLang()
  const s = c.stages.items[stage]
  const idx = order.indexOf(stage)
  const prev = order[idx - 1]
  const next = order[idx + 1]
  const navLabel = (route) => c.ui.nav[c.menu.findIndex((m) => m.route === route)]

  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} desc={s.summary} />

      <section id="overview" className="scroll-mt-32 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          {s.facts.map(([k, v]) => (
            <div key={k} className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-bold text-brand-600">{k}</p>
              <p className="mt-2 text-lg font-extrabold leading-snug text-ink">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="steps" className="scroll-mt-32 bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-ink">{c.stages.stepsLabel}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-4">
            {s.steps.map(([title, desc], i) => (
              <li key={title} className="rounded-3xl bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 font-extrabold text-white">{i + 1}</span>
                <p className="mt-4 text-lg font-extrabold text-ink">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="support" className="scroll-mt-32 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-extrabold text-ink">{c.stages.supportLabel}</h2>
            <ul className="mt-6 space-y-3 text-lg">
              {s.support.map((p) => (
                <CheckItem key={p}>{p}</CheckItem>
              ))}
            </ul>
            <p className="mt-8 rounded-2xl bg-lime-soft px-5 py-4 text-sm text-ink">{c.stages.disclaimer}</p>
          </div>
          <div className="space-y-4">
            {prev && (
              <a href={href(prev)} className="flex items-center justify-between rounded-3xl border border-slate-200 p-6 transition hover:border-brand-600">
                <span>
                  <span className="text-sm font-bold text-ink-soft">{c.ui.prev}</span>
                  <span className="mt-1 block text-lg font-extrabold text-ink">{navLabel(prev)}</span>
                </span>
                <Icon name="arrow" className="h-5 w-5 rotate-180 text-ink-soft" />
              </a>
            )}
            {next && (
              <a href={href(next)} className="flex items-center justify-between rounded-3xl bg-brand-600 p-6 text-white transition hover:bg-brand-700">
                <span>
                  <span className="text-sm font-bold text-brand-100">{c.ui.next}</span>
                  <span className="mt-1 block text-lg font-extrabold">{navLabel(next)}</span>
                </span>
                <Icon name="arrow" className="h-5 w-5" />
              </a>
            )}
            <a href={href('consult/form')} className="flex items-center justify-between rounded-3xl bg-lime-brand p-6 text-ink transition hover:bg-lime-deep">
              <span className="text-lg font-extrabold">{c.hero.ctaConsult}</span>
              <Icon name="arrow" className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}

export default StagePage
