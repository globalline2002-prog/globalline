import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader } from '../components/Ui'
import { useLang } from '../lang'

function NewsItem({ item }) {
  const { c } = useLang()
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href.split('#')[0] + '#/news/notice'
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.body, url })
      } catch {
        // 취소
      }
      return
    }
    try {
      await navigator.clipboard.writeText(`${item.title}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt(c.news.share, url)
    }
  }

  return (
    <li className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{item.tag}</span>
        <span className="text-sm text-ink-soft">{item.date}</span>
      </div>
      <h3 className="mt-3 text-xl font-extrabold text-ink">{item.title}</h3>
      <p className="mt-2 text-ink-soft">{item.body}</p>
      <button onClick={share} className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ink">
        <Icon name="share" className="h-4 w-4" />
        {copied ? c.news.copied : c.news.share}
      </button>
    </li>
  )
}

function NewsPage() {
  const { c } = useLang()
  const n = c.news
  return (
    <>
      <PageHeader {...c.pages.news} />
      <section id="notice" className="scroll-mt-32 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-ink">{n.noticeTitle}</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {n.items.map((item) => (
              <NewsItem key={item.title} item={item} />
            ))}
          </ul>
        </div>
      </section>
      <section id="faq" className="scroll-mt-32 bg-surface py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-ink">{n.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {n.faqs.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink">
                  {q}
                  <Icon name="plus" className="h-5 w-5 shrink-0 text-brand-600 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default NewsPage
