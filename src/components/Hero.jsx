function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.5), transparent 40%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.4), transparent 45%)',
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="mb-6 inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
          Global C&amp;B · 해외 유학생 여정 관리 플랫폼
        </span>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          출국부터 정주까지,
          <br />
          <span className="text-indigo-400">한 사람을 위한 로드맵</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
          GlCnB는 출국 전 준비부터 어학연수, 학부진학, 취업·정주까지
          유학생의 전 과정을 4단계로 관리하는 통합 플랫폼입니다.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#journey"
            className="rounded-full bg-indigo-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
          >
            4단계 여정 살펴보기
          </a>
          <a
            href="#contact"
            className="rounded-full border border-slate-600 px-8 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
          >
            무료 상담 신청
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
