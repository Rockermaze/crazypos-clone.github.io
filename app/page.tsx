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
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-slate-100">Empower Your Retail Business</h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">All‑in‑one POS for retail, repairs, and trade‑ins. Simplify operations and grow smarter.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/auth/start" className="rounded-xl bg-brand-700 dark:bg-brand-600 px-5 py-3 text-white font-semibold shadow-soft hover:bg-brand-600 dark:hover:bg-brand-700 transition-colors">Start Free →</Link>
                <Link href="/products" className="rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Discover Features</Link>
              </div>
            </div>
            <div className="relative">
            <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-brand-500/20 to-brand-700/30 dark:from-brand-500/10 dark:to-brand-700/20" />
            </div>
          </div>
        </Container>
      </Section>

      {/* Feature highlights */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Featured Functions</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.slice(0,8).map(f => <FeatureCard key={f.title} {...f}/>) }
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container>
          <div className="rounded-3xl bg-brand-700 dark:bg-brand-600 p-10 text-white">
            <h3 className="text-2xl font-bold">Start your business here</h3>
            <p className="mt-2 opacity-90">Register for free — no payment method required.</p>
            <Link href="/auth/start" className="mt-6 inline-block rounded-xl bg-white dark:bg-slate-100 px-5 py-3 font-semibold text-brand-700 dark:text-brand-800 hover:bg-slate-50 dark:hover:bg-white transition-colors">Register</Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
