import { unstable_setRequestLocale } from 'next-intl/server'
import { HeroSection } from '../../components/landing/HeroSection'
import { HowItWorks } from '../../components/landing/HowItWorks'
import { StatsBar } from '../../components/landing/StatsBar'

export default function LandingPage({ params: { lang } }: { params: { lang: string } }) {
  unstable_setRequestLocale(lang)

  return (
    <div className="flex flex-1 flex-col pb-8">
      <HeroSection />
      <StatsBar />
      <div className="mt-8 px-6">
        <HowItWorks />
      </div>
    </div>
  )
}
