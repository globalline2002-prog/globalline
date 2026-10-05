import { useEffect, useMemo, useRef, useState } from 'react'
import { languages, useLang } from '../lang'
import { href, pages } from '../router'
import Icon from './Icon'

function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2.5" aria-label="Global C&B">
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[3px_3px_0_0_var(--color-lime-brand)]">
        <Icon name="cap" className="h-6 w-6" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">Global C&amp;B</span>
    </a>
  )
}

function LangSelect({ className = '' }) {
  const { lang, setLang, c } = useLang()
  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">{c.ui.language}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-ink outline-none transition hover:border-slate-300 focus:border-brand-500"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </label>
  )
}

function SearchModal({ onClose }) {
  const { c } = useLang()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => inputRef.current?.focus(), [])

  // 메뉴·FAQ·뉴스에서 현재 언어로 검색 인덱스를 만듭니다.
  const index = useMemo(() => {
    const items = []
    c.menu.forEach((group, i) => {
      group.links.forEach(([section, label]) => {
        items.push({ title: label, group: c.ui.nav[i], route: `${group.route}/${section}` })
      })
    })
    c.news.faqs.forEach(([q2, a]) => items.push({ title: q2, group: c.news.faqTitle, route: 'news/faq', extra: a }))
    c.news.items.forEach((n) => items.push({ title: n.title, group: c.news.noticeTitle, route: 'news/notice', extra: n.body }))
    return items
  }, [c])

  const term = q.trim().toLowerCase()
  const results = term
    ? index.filter((it) => `${it.title} ${it.group} ${it.extra || ''}`.toLowerCase().includes(term))
    : index.slice(0, 8)

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/50 p-4 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5">
          <Icon name="search" className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder={c.ui.searchPlaceholder}
            className="h-16 flex-1 text-base outline-none placeholder:text-slate-400"
          />
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={c.ui.close}>
            <Icon name="close" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-soft">{c.ui.noResult}</li>}
          {results.map((r) => (
            <li key={r.route + r.title}>
              <a href={href(r.route)} onClick={onClose} className="flex flex-col rounded-2xl px-4 py-3 hover:bg-surface">
                <span className="text-xs font-semibold text-brand-600">{r.group}</span>
                <span className="font-semibold text-ink">{r.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FullMenu({ onClose }) {
  const { c } = useLang()
  return (
    <div className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold">{c.ui.menu}</span>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label={c.ui.close}>
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <LangSelect className="mt-6 block sm:hidden" />
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {c.menu.map((group, i) => (
            <div key={group.route}>
              <a href={href(group.route)} onClick={onClose} className="flex items-center gap-2 border-b-2 border-lime-brand pb-2 text-lg font-extrabold text-ink hover:text-brand-600">
                {c.ui.nav[i]}
              </a>
              <ul className="mt-3 space-y-1">
                {group.links.map(([section, label]) => (
                  <li key={section}>
                    <a href={href(`${group.route}/${section}`)} onClick={onClose} className="block rounded-lg px-2 py-1.5 text-ink-soft hover:bg-surface hover:text-brand-600">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Header({ page }) {
  const { c } = useLang()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = searchOpen || menuOpen ? 'hidden' : ''
  }, [searchOpen, menuOpen])

  return (
    <>
      <div className="bg-lime-soft px-4 py-1.5 text-center text-xs font-medium text-ink sm:text-sm">
        {c.ui.audiences.join(' · ')}
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setSearchOpen(true)} className="flex h-12 items-center gap-2 rounded-2xl px-3 font-bold text-ink hover:bg-surface">
              <Icon name="search" />
              <span className="hidden md:inline">{c.ui.search}</span>
            </button>
            <LangSelect className="hidden w-40 sm:block" />
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-12 items-center gap-2 rounded-2xl border-2 border-ink/80 px-4 font-bold text-ink transition hover:bg-ink hover:text-white"
            >
              <Icon name="menu" />
              <span className="hidden md:inline">{c.ui.menu}</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-2 sm:px-4">
          <ul className="flex min-w-max items-center gap-1 text-[15px] font-bold text-ink-soft">
            {pages.map((p, i) => (
              <li key={p}>
                <a
                  href={href(p)}
                  className={`block border-b-[3px] px-3 py-3 transition hover:text-brand-600 sm:px-5 ${
                    page === p ? 'border-brand-600 text-brand-600' : 'border-transparent'
                  }`}
                >
                  {c.ui.nav[i]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {menuOpen && <FullMenu onClose={() => setMenuOpen(false)} />}
    </>
  )
}

export default Header
