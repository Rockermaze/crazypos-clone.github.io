'use client'

import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      default:
        return 'bg-brand-700 hover:bg-brand-600 focus:ring-brand-500'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      default:
        return 'text-brand-600'
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-opacity-10 ${getIconColor()}`}>
          <div className={getIconColor()}>
            {getIcon()}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-slate-900">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantStyles()}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}
