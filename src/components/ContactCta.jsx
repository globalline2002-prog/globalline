function ContactCta() {
  return (
    <section id="contact" className="bg-indigo-600 py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          지금 GlCnB와 유학 여정을 시작하세요
        </h2>
        <p className="mt-4 max-w-xl text-indigo-100">
          출국 전 준비부터 취업·정주까지, 전문 코디네이터가 단계별로
          함께합니다. 무료 상담을 통해 나만의 로드맵을 받아보세요.
        </p>
        <a
          href="mailto:contact@glcnb.com"
          className="mt-8 rounded-full bg-white px-8 py-3 text-base font-semibold text-indigo-600 shadow-lg transition hover:bg-indigo-50"
        >
          무료 상담 신청하기
        </a>
      </div>
    </section>
  )
}

export default ContactCta
