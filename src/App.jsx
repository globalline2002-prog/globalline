import Navbar from './components/Navbar'
import Hero from './components/Hero'
import JourneySection from './components/JourneySection'
import HowItWorks from './components/HowItWorks'
import ContactCta from './components/ContactCta'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <JourneySection />
      <HowItWorks />
      <ContactCta />
      <Footer />
    </div>
  )
}

export default App
