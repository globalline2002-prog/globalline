import { CoursesSection } from '../components/Courses'
import CtaBand from '../components/CtaBand'
import { PageHeader } from '../components/Ui'
import { useLang } from '../lang'

function PreDeparturePage() {
  const { c } = useLang()
  return (
    <>
      <PageHeader {...c.pages['pre-departure']} />
      <CoursesSection />
      <CtaBand />
    </>
  )
}

export default PreDeparturePage
