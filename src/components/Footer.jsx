import { platform } from '../config'
import { useLang } from '../lang'
import { href, pages } from '../router'
import Icon from './Icon'

function Footer() {
  const { c } = useLang()
  return (
    <footer className="bg-ink text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="cap" />
            </span>
            <span className="text-xl font-extrabold text-white">Global C&amp;B</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{c.footer.desc}</p>
          <a href={`mailto:${platform.contactEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime-brand hover:underline">
            <Icon name="mail" className="h-4 w-4" />
            {platform.contactEmail}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {pages.map((p, i) => (
            <a key={p} href={href(p)} className="py-1 hover:text-white">
              {c.ui.nav[i]}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} Global C&amp;B. {c.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
