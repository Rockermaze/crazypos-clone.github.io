'use client'
import { useState } from 'react'
import { Container } from '@/components/Container'
import { Section } from '@/components/Section'
import { PlanToggle } from '@/components/PlanToggle'
import { PricingCard } from '@/components/PricingCard'
import { plans } from '@/content/pricing'

export default function Pricing(){
  const [mode, setMode] = useState<'monthly'|'yearly'>('monthly')
  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Subscription Plans</h1>
        <p className="mt-2 text-slate-600">Choose the right plan for your business.</p>
        <div className="mt-6"><PlanToggle onChange={setMode} /></div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map(p=>{
            const value = mode==='monthly' ? p.monthly : p.yearly
            const price = value===null ? 'Custom' : `AUD ${value}`
            const period = value===null ? '' : `/ Store Per Month`
            return <PricingCard key={p.name} name={p.name} blurb={p.blurb} price={price} period={period} cta={p.cta}/>
          })}
        </div>
      </Container>
    </Section>
  )
}
