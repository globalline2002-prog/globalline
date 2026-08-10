const features = [
  {
    title: '개인 맞춤 로드맵',
    description: '학생의 목표 국가·전공·비자 유형에 맞춰 4단계 여정을 자동으로 설계합니다.',
  },
  {
    title: '실시간 진행 관리',
    description: '체크리스트와 일정 알림으로 서류 마감, 학사 일정을 놓치지 않도록 돕습니다.',
  },
  {
    title: '전문 코디네이터 매칭',
    description: '단계별 전문 코디네이터가 배정되어 궁금한 점을 바로 상담할 수 있습니다.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Why GlCnB
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            흩어진 유학 준비를 하나의 플랫폼으로
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 p-8 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
