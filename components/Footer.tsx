import Link from 'next/link'
import { Container } from './Container'

export function Footer(){
  return (
    <footer className="mt-24 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-12 text-sm transition-colors">
      <Container>
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">ABOUT YOURPOS</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Home</Link></li>
              <li><Link href="/products" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Product Overview</Link></li>
              <li><Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/support" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Customer Support</Link></li>
              <li><Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">Terms and Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">COMPANY INFO</h3>
            <p className="mt-3 leading-6 text-slate-600 dark:text-slate-400">Your Company Pty Ltd<br/>+61 000 000 000<br/>123 Example St, City, Country</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">OUR MISSION</h3>
            <p className="mt-3 max-w-prose leading-6 text-slate-600 dark:text-slate-400">Empower retailers with a platform that simplifies operations and delights customers — all in one intuitive system.</p>
          </div>
        </div>
        <p className="mt-8 text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} Your Company — All rights reserved.</p>
      </Container>
    </footer>
  )
}
