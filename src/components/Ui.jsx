import Icon from './Icon'

export function SectionHead({ eyebrow, title, desc, center = false, id }) {
  return (
    <div id={id} className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && (
        <span className="text-sm font-bold tracking-wider text-brand-600">{eyebrow}</span>
      )}
      <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{desc}</p>}
    </div>
  )
}

export function PageHeader({ eyebrow, title, desc }) {
  return (
    <section className="relative overflow-hidden bg-surface">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-brand/40 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-bold tracking-wide text-brand-600">
          <Icon name="cap" className="h-4 w-4" />
          {eyebrow}
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{desc}</p>
      </div>
    </section>
  )
}

export function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-ink-soft">
      <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  )
}

export function ButtonLink({ href, children, variant = 'primary', className = '', ...rest }) {
  const styles = {
    primary:
      'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700',
    outline: 'border-2 border-ink/80 bg-white text-ink hover:bg-ink hover:text-white',
    lime: 'bg-lime-brand text-ink hover:bg-lime-deep',
    white: 'bg-white text-brand-700 hover:bg-brand-50',
  }
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold transition ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  )
}
