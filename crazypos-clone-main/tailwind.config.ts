import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          900: 'var(--brand-900)',
          700: 'var(--brand-700)',
          500: 'var(--brand-500)',
          100: 'var(--brand-100)',
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.08)'
      }
    }
  },
  plugins: []
}
export default config
