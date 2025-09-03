'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

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
    <header className="fixed inset-x-0 top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-700 transition-colors">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="font-bold text-lg text-slate-900 dark:text-white hover:text-brand-700 dark:hover:text-brand-400 transition-colors">YourPOS</Link>
        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button className="text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors" onClick={()=>setOpen(!open)} aria-label="Toggle menu">☰</button>
        </div>
        <div className={`${open ? 'flex flex-col gap-4 absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-6' : 'hidden'} lg:flex lg:flex-row lg:gap-6 lg:static lg:bg-transparent lg:dark:bg-transparent lg:border-none lg:px-0 lg:py-0`}>
          {links.map(l=> (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">{l.label}</Link>
          ))}
          <div className="flex flex-col gap-3 lg:hidden mt-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400">Log in</Link>
            <Link href="/auth/start" className="rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold shadow-soft hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-700 text-center">Start Free Trial</Link>
          </div>
        </div>
        <div className="hidden gap-3 lg:flex items-center">
          <ThemeToggle />
          <Link href="/auth/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-400">Log in</Link>
          <Link href="/auth/start" className="rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold shadow-soft hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-700">Start Free Trial</Link>
        </div>
      </nav>
    </header>
  )
}
