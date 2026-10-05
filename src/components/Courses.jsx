import { useState } from 'react'
import { linkProps, platformLink } from '../config'
import { useLang } from '../lang'
import { setPrefill } from '../lib/prefill'
import { href } from '../router'
import Icon from './Icon'
import { CheckItem, SectionHead } from './Ui'

export function CourseCards({ compact = false }) {
  const { c } = useLang()
  const k = c.courses
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {k.items.map((item) => (
        <article
          key={item.hours}
          className={`relative flex flex-col rounded-3xl border bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl ${
            item.highlight ? 'border-brand-600 shadow-lg shadow-brand-600/10' : 'border-slate-200'
          }`}
        >
          {item.highlight && (
            <span className="absolute -top-3 right-6 rounded-full bg-lime-brand px-3 py-1 text-xs font-extrabold text-ink">
              {k.recommended}
            </span>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold tracking-tight text-brand-600">{item.hours}</span>
            <span className="text-lg font-bold text-ink">{k.hoursUnit}</span>
            <span className="ml-2 rounded-full bg-surface px-3 py-1 text-sm font-bold text-ink">{item.name}</span>
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-ink">{item.tagline}</h3>
          <p className="mt-1 text-sm text-ink-soft">{item.period}</p>
          {!compact && (
            <>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="font-bold text-ink">{k.targetLabel}</dt>
                  <dd className="text-ink-soft">{item.target}</dd>
                </div>
                <div>
                  <dt className="font-bold text-ink">{k.goalLabel}</dt>
                  <dd className="text-ink-soft">{item.goal}</dd>
                </div>
              </dl>
              <ul className="mt-5 space-y-2 text-sm">
                {item.modules.map((m) => (
                  <CheckItem key={m}>{m}</CheckItem>
                ))}
              </ul>
            </>
          )}
          <div className="mt-auto pt-6">
            <div className="rounded-2xl bg-surface px-4 py-3 text-sm">
              <span className="font-bold text-brand-700">{k.outcomeLabel} · </span>
              <span className="text-ink">{item.outcome}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function CompareTable() {
  const { c } = useLang()
  const k = c.courses
  return (
    <div id="compare" className="scroll-mt-32">
      <h3 className="text-2xl font-extrabold text-ink">{k.compareTitle}</h3>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm sm:text-base">
          <thead>
            <tr className="bg-ink text-white">
              <th className="px-5 py-4 font-bold">{k.compareHead}</th>
              {k.items.map((i) => (
                <th key={i.hours} className={`px-5 py-4 text-center font-bold ${i.highlight ? 'bg-brand-600' : ''}`}>
                  {i.hours}
                  {k.hoursUnit} · {i.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {k.compareRows.map(([label, ...vals]) => (
              <tr key={label} className="border-t border-slate-100">
                <th className="px-5 py-3.5 font-semibold text-ink">{label}</th>
                {vals.map((v, idx) => (
                  <td key={idx} className={`px-5 py-3.5 text-center text-ink-soft ${k.items[idx].highlight ? 'bg-brand-50/60 font-semibold text-ink' : ''}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CourseFinder() {
  const { c } = useLang()
  const f = c.courses.finder
  const [answers, setAnswers] = useState([])
  const done = answers.length === f.questions.length

  // 점수 합 0~6 → 48 / 80 / 200시간
  const total = answers.reduce((a, b) => a + b, 0)
  const pick = total <= 1 ? 0 : total <= 3 ? 1 : 2
  const course = c.courses.items[pick]

  const goConsult = () => {
    setPrefill({ type: 'student', interest: c.consult.interests.student[pick], finder: `${course.hours}h` })
  }

  return (
    <div id="course-finder" className="scroll-mt-32 rounded-[2rem] bg-brand-600 p-6 text-white sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="inline-flex rounded-full bg-lime-brand px-3 py-1 text-xs font-extrabold text-ink">LEVEL CHECK</span>
          <h3 className="mt-4 text-3xl font-extrabold">{f.title}</h3>
          <p className="mt-3 text-brand-100">{f.desc}</p>
          <div className="mt-6 flex gap-2">
            {f.questions.map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < answers.length ? 'bg-lime-brand' : 'bg-white/25'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 text-ink sm:p-8">
          {!done ? (
            <>
              <p className="text-sm font-bold text-brand-600">
                Q{answers.length + 1}. / {f.questions.length}
              </p>
              <p className="mt-2 text-xl font-extrabold">{f.questions[answers.length].q}</p>
              <div className="mt-5 grid gap-3">
                {f.questions[answers.length].options.map((opt, score) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers([...answers, score])}
                    className="rounded-2xl border-2 border-slate-200 px-5 py-4 text-left font-semibold transition hover:border-brand-600 hover:bg-brand-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-brand-600">{f.resultLabel}</p>
              <p className="mt-2 text-4xl font-extrabold">
                {course.hours}
                {c.courses.hoursUnit} <span className="text-brand-600">{course.name}</span>
              </p>
              <p className="mt-2 font-semibold">{course.tagline}</p>
              <p className="mt-2 text-sm text-ink-soft">{f.resultDesc}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={href('consult/form')} onClick={goConsult} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700">
                  {f.cta}
                  <Icon name="arrow" className="h-4 w-4" />
                </a>
                <a {...linkProps(platformLink('levelTest'))} className="inline-flex items-center rounded-full border-2 border-ink/80 px-5 py-3 font-bold hover:bg-ink hover:text-white">
                  {f.levelTest}
                </a>
                <button onClick={() => setAnswers([])} className="px-3 py-3 text-sm font-semibold text-ink-soft underline">
                  {f.restart}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function CoursesSection() {
  const { c } = useLang()
  return (
    <section id="courses" className="scroll-mt-32 py-20">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6">
        <SectionHead eyebrow={c.courses.eyebrow} title={c.courses.title} desc={c.courses.desc} />
        <CourseCards />
        <CompareTable />
        <CourseFinder />
      </div>
    </section>
  )
}
