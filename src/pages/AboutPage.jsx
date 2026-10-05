import CtaBand from '../components/CtaBand'
import PlatformSection from '../components/Platform'
import { PageHeader } from '../components/Ui'
import { useLang } from '../lang'

function AboutPage() {
  const { c } = useLang()
  const a = c.about
  return (
    <>
      <PageHeader {...c.pages.about} />

      <section id="mission" className="scroll-mt-32 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{a.missionTitle}</h2>
            {a.mission.map((p) => (
              <p key={p} className="mt-5 text-lg leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 self-start">
            {a.stats.map(([value, unit, label]) => (
              <div key={label} className="rounded-3xl bg-surface p-6">
                <p className="text-5xl font-extrabold text-brand-600">
                  {value}
                  <span className="ml-1 text-lg text-ink">{unit}</span>
                </p>
                <p className="mt-2 font-semibold text-ink-soft">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PlatformSection />

      <section id="values" className="scroll-mt-32 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-ink">{a.valuesTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {a.values.map(([title, desc], i) => (
              <div key={title} className="rounded-3xl border border-slate-200 p-7">
                <span className="text-sm font-extrabold text-lime-deep">0{i + 1}</span>
                <p className="mt-2 text-xl font-extrabold text-ink">{title}</p>
                <p className="mt-2 text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}

export default AboutPage
