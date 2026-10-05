import { useEffect } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import Icon from './components/Icon'
import { useLang } from './lang'
import { captureAttribution } from './lib/crm'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import ConsultPage from './pages/ConsultPage'
import HomePage from './pages/HomePage'
import NewsPage from './pages/NewsPage'
import PreDeparturePage from './pages/PreDeparturePage'
import StagePage from './pages/StagePage'
import { href, useRoute } from './router'

function Page({ page }) {
  switch (page) {
    case 'consult':
      return <ConsultPage />
    case 'about':
      return <AboutPage />
    case 'pre-departure':
      return <PreDeparturePage />
    case 'd4':
    case 'd2':
    case 'career':
      return <StagePage key={page} stage={page} />
    case 'news':
      return <NewsPage />
    case 'admin':
      return <AdminPage />
    default:
      return <HomePage />
  }
}

function App() {
  const { c } = useLang()
  const { page } = useRoute()

  useEffect(() => {
    captureAttribution()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header page={page} />
      <main>
        <Page page={page} />
      </main>
      <Footer />
      {page !== 'consult' && page !== 'admin' && (
        <a
          href={href('consult/form')}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 font-extrabold text-white shadow-xl shadow-brand-600/30 ring-4 ring-lime-brand/70 transition hover:bg-brand-700"
        >
          <Icon name="chat" className="h-5 w-5" />
          {c.ui.consultNow}
        </a>
      )}
    </div>
  )
}

export default App
