import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import { Section } from '@/components/Section'
import { BadgeRow } from '@/components/BadgeRow'
import { FeatureCard } from '@/components/FeatureCard'
import { features } from '@/content/features'

export default function Home(){
  return (
    <>
      {/* Hero */}
      <Section>
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Empower Your Retail Business</h1>
              <p className="mt-4 text-lg text-slate-600">All‑in‑one POS for retail, repairs, and trade‑ins. Simplify operations and grow smarter.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/auth/start" className="rounded-xl bg-brand-700 px-5 py-3 text-white font-semibold shadow-soft">Start Free →</Link>
                <Link href="/products" className="rounded-xl border px-5 py-3 font-semibold">Discover Features</Link>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <Image src="/app-store-badge.svg" width={160} height={50} alt="Download on the App Store"/>
                <Image src="/google-play-badge.svg" width={160} height={50} alt="Get it on Google Play"/>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-brand-500/20 to-brand-700/30" />
            </div>
          </div>
          <BadgeRow className="mt-12"/>
        </Container>
      </Section>

      {/* Feature highlights */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold">Featured Functions</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.slice(0,8).map(f => <FeatureCard key={f.title} {...f}/>) }
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container>
          <div className="rounded-3xl bg-brand-700 p-10 text-white">
            <h3 className="text-2xl font-bold">Start your business here</h3>
            <p className="mt-2 opacity-90">Register for free — no payment method required.</p>
            <Link href="/auth/start" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-brand-700">Register</Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
