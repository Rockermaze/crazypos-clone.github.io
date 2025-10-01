import './globals.css'
import { ReactNode } from 'react'
import { Providers } from '@/components/Providers'
import { AppChrome } from '@/components/AppChrome'

export const metadata = {
  title: 'YourPOS – Smart POS for Retail',
  description: 'All‑in‑one POS for retail, repairs, and trade‑ins.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.className = 'dark';
                  }
                } catch (e) {
                  // Keep default light class
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  )
}
