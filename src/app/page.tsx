import { AISection } from '@/components/home/AISection'
import { Features } from '@/components/home/Features'
import { FinalCTA } from '@/components/home/FinalCTA'
import { Footer } from '@/components/home/Footer'
import { Hero } from '@/components/home/Hero'
import { HomeNav } from '@/components/home/HomeNav'
import { PricingSection } from '@/components/home/PricingSection'

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-[#e6e8ee]"
      style={{
        background:
          'radial-gradient(1200px 600px at 80% -100px, rgba(99,102,241,0.18), transparent 60%), radial-gradient(900px 500px at -10% 10%, rgba(236,72,153,0.12), transparent 60%), #07090f',
      }}
    >
      <HomeNav />
      <main>
        <Hero />
        <Features />
        <AISection />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
