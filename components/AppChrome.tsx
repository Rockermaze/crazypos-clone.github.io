'use client'
import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hideChrome = pathname?.startsWith('/dashboard')

  return (
    <>
      {!hideChrome && <Navbar />}
      <main className={hideChrome ? '' : 'pt-20'}>{children}</main>
      {!hideChrome && <Footer />}
    </>
  )
}
