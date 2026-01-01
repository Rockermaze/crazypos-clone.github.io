import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon = '📦', title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-all hover:shadow-lg transform hover:scale-105"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  )
}
