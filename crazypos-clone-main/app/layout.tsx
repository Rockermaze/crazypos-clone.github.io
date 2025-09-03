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
    <html lang="en" className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                  // Keep light as default, no need to check system preference
                } catch (e) {
                  // Already has light class, do nothing
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <Providers>
          <Navbar />
          <main className="pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
