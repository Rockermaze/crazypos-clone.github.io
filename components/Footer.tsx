import Link from 'next/link'
import { Container } from './Container'

export function Footer(){
  return (
    <footer className="mt-24 border-t bg-slate-50 py-12 text-sm">
      <Container>
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold">ABOUT YOURPOS</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Product Overview</Link></li>
              <li><Link href="/pricing">Pricing & Plans</Link></li>
              <li><Link href="/support">Customer Support</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms and Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">COMPANY INFO</h3>
            <p className="mt-3 leading-6">Your Company Pty Ltd<br/>+61 000 000 000<br/>123 Example St, City, Country</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-semibold">OUR MISSION</h3>
            <p className="mt-3 max-w-prose leading-6">Empower retailers with a platform that simplifies operations and delights customers — all in one intuitive system.</p>
          </div>
        </div>
        <p className="mt-8 text-slate-500">© {new Date().getFullYear()} Your Company — All rights reserved.</p>
      </Container>
    </footer>
  )
}
