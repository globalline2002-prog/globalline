import { journeySteps } from '../data/journey'

function JourneyCard({ step, tag, title, description, points, isLast }) {
  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-md">
          {step}
        </div>
        {!isLast && <div className="mt-2 w-px flex-1 bg-slate-200" />}
      </div>

      <div className="flex-1 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {tag}
          </span>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">{title}</h3>
          <p className="mt-3 text-slate-600">{description}</p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <span className="mt-0.5 text-indigo-500">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function JourneySection() {
  return (
    <section id="journey" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            The GlCnB Journey
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            유학생의 4단계 여정을 함께합니다
          </h2>
          <p className="mt-4 text-slate-600">
            출국 전 준비부터 정착까지, 단계마다 필요한 지원을 놓치지 않도록
            설계했습니다.
          </p>
        </div>

        <div className="mt-16">
          {journeySteps.map((item, index) => (
            <JourneyCard
              key={item.step}
              {...item}
              isLast={index === journeySteps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default JourneySection
