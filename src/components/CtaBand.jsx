import { platform } from '../config'
import { useLang } from '../lang'
import { href } from '../router'
import Icon from './Icon'

function CtaBand() {
  const { c } = useLang()
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-600 px-6 py-14 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-lime-brand/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold sm:text-4xl">{c.home.ctaTitle}</h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-brand-100">{c.home.ctaDesc}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <a href={href('consult/form')} className="inline-flex items-center gap-2 rounded-full bg-lime-brand px-7 py-4 font-extrabold text-ink hover:bg-lime-deep">
            {c.hero.ctaConsult}
            <Icon name="arrow" className="h-4 w-4" />
          </a>
          <a href={platform.levelTestUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border-2 border-white/70 px-7 py-4 font-bold text-white hover:bg-white hover:text-brand-700">
            {c.courses.finder.levelTest}
          </a>
        </div>
      </div>
    </section>
  )
}

export default CtaBand
