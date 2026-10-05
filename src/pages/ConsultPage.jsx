import ConsultForm from '../components/ConsultForm'
import { Institutions, LinkGenerator, Partners, Portals, Referral, Sales } from '../components/Growth'
import Icon from '../components/Icon'
import { PageHeader } from '../components/Ui'
import { platform } from '../config'
import { useLang } from '../lang'

function ConsultPage() {
  const { c } = useLang()
  const t = c.consult
  const contacts = [
    { icon: 'mail', label: t.sideEmail, href: `mailto:${platform.contactEmail}`, sub: platform.contactEmail },
    platform.kakaoChannelUrl && { icon: 'chat', label: t.sideKakao, href: platform.kakaoChannelUrl, sub: 'KakaoTalk' },
    { icon: 'book', label: t.sideLevel, href: platform.levelTestUrl, sub: 'LMS' },
  ].filter(Boolean)

  return (
    <>
      <PageHeader {...c.pages.consult} />

      <section id="form" className="scroll-mt-32 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <span className="text-sm font-bold tracking-wider text-brand-600">{t.eyebrow}</span>
            <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{t.title}</h2>
            <p className="mt-4 text-lg text-ink-soft">{t.desc}</p>
            <div className="mt-8 rounded-3xl bg-surface p-6">
              <p className="font-extrabold text-ink">{t.sideTitle}</p>
              <ul className="mt-4 space-y-3">
                {contacts.map((x) => (
                  <li key={x.label}>
                    <a href={x.href} target={x.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-white p-4 hover:shadow-md">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon name={x.icon} />
                      </span>
                      <span>
                        <span className="block font-bold text-ink">{x.label}</span>
                        <span className="block text-sm text-ink-soft">{x.sub}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-soft">{t.sideHours}</p>
            </div>
          </div>
          <ConsultForm />
        </div>
      </section>

      <Portals />
      <Referral />
      <LinkGenerator />
      <Sales />
      <Partners />
      <Institutions />
    </>
  )
}

export default ConsultPage
