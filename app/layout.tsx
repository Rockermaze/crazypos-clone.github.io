import './globals.css'
import { ReactNode } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Providers } from '@/components/Providers'

export const metadata = {
  title: 'YourPOS – Smart POS for Retail',
  description: 'All‑in‑one POS for retail, repairs, and trade‑ins.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-slate-900">
        <Providers>
          <Navbar />
          <main className="pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
