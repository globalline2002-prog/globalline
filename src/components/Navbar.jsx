const navLinks = [
  { label: '서비스 소개', href: '#journey' },
  { label: '학습 콘텐츠', href: '#lms' },
  { label: '이용 방법', href: '#how-it-works' },
  { label: '문의하기', href: '#contact' },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            G
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            GlCnB
          </span>
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition hover:text-indigo-600">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          무료 상담 신청
        </a>
      </nav>
    </header>
  )
}

export default Navbar
