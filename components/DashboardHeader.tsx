'use client'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function DashboardHeader({ userLabel, onLogout }: { userLabel: string; onLogout: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-700 transition-colors">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/dashboard" className="font-bold text-lg text-slate-900 dark:text-white hover:text-brand-700 dark:hover:text-brand-400 transition-colors">YourPOS</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-purple-700 dark:text-purple-400 font-medium">Welcome, {userLabel}</span>
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="rounded-xl bg-brand-700 px-4 py-2 text-white text-sm font-semibold shadow-soft hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  )
}
