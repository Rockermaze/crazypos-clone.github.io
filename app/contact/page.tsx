'use client'
import { useState } from 'react'
import { Container } from '@/components/Container'
import { Section } from '@/components/Section'

export default function Contact(){
  const [sent, setSent] = useState(false)
  return (
    <Section>
      <Container>
        <h1 className="text-3xl font-extrabold">Contact</h1>
        <p className="mt-2 text-slate-600">Have questions? We’d love to hear from you.</p>
        <form onSubmit={(e)=>{ e.preventDefault(); setSent(true) }} className="mt-6 grid gap-4 md:max-w-xl">
          <input required placeholder="Your Name" className="rounded-xl border p-3"/>
          <input required type="email" placeholder="Your Email" className="rounded-xl border p-3"/>
          <textarea required placeholder="Your Message" rows={6} className="rounded-xl border p-3"></textarea>
          <button className="rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white">Submit</button>
          {sent && <p className="text-green-700">Thanks! We’ll reply soon.</p>}
        </form>
        <div className="mt-10">
          <h3 className="font-semibold">Company Info</h3>
          <p className="mt-2 text-slate-600">Your Company Pty Ltd · +61 000 000 000 · 123 Example St, City, Country</p>
        </div>
      </Container>
    </Section>
  )
}
