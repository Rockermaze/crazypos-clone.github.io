'use client'
import Link from 'next/link'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Product Overview' },
  { href: '/pricing', label: 'Pricing & Plans' },
  { href: '/support', label: 'Customer Support' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
]

export function Navbar(){
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/70 backdrop-blur border-b">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="font-bold text-lg">YourPOS</Link>
        <button className="lg:hidden" onClick={()=>setOpen(!open)} aria-label="Toggle menu">☰</button>
        <div className={`gap-6 lg:flex ${open? 'block' : 'hidden'}`}>
          {links.map(l=> (
            <Link key={l.href} href={l.href} className="text-sm font-medium hover:text-brand-700">{l.label}</Link>
          ))}
        </div>
        <div className="hidden gap-3 lg:flex">
          <Link href="/auth/login" className="text-sm font-medium">Log in</Link>
          <Link href="/auth/start" className="rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold shadow-soft hover:bg-brand-500">Start Free Trial</Link>
        </div>
      </nav>
    </header>
  )
}
