import { lmsCategories } from '../data/lms'

function LmsCard({ title, description, status }) {
  const isLive = status === '제공 중'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
          isLive
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {status}
      </span>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  )
}

function LmsSection() {
  return (
    <section id="lms" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            GlCnB LMS
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            단계별 학습 콘텐츠로 여정을 채웁니다
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            출국 전 준비부터 인생 2막까지, 각 단계에 필요한 학습 콘텐츠를
            카테고리별로 제공합니다. 지금은 출국 전 준비와 어학연수 콘텐츠를
            먼저 제공하고 있어요.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lmsCategories.map((category) => (
            <LmsCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default LmsSection
