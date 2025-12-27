'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'

interface InvoiceSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  receiptNumber: string
  saleId: string
  emailSent?: boolean
  emailMessage?: string
  shouldPrint: boolean
  onPrint: () => void
}

export function InvoiceSuccessModal({
  isOpen,
  onClose,
  receiptNumber,
  saleId,
  emailSent = false,
  emailMessage,
  shouldPrint,
  onPrint
}: InvoiceSuccessModalProps) {
  const [printInitiated, setPrintInitiated] = useState(false)
  const [showPrintUI, setShowPrintUI] = useState(false)

  // Auto-trigger print if requested
  useEffect(() => {
    if (isOpen && shouldPrint && !printInitiated) {
      setPrintInitiated(true)
      setShowPrintUI(true)
    }
  }, [isOpen, shouldPrint, printInitiated])

  const handlePrintClick = () => {
    setShowPrintUI(true)
    onPrint()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful! 🎉">
      <div className="space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Payment Completed Successfully
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Receipt Number: <span className="font-semibold text-brand-600 dark:text-brand-400">{receiptNumber}</span>
          </p>
        </div>

        {/* Email Status */}
        {emailSent && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100">Invoice Sent!</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">{emailMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Print Section */}
        {shouldPrint && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🖨️</span>
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Print Invoice</p>
                {showPrintUI ? (
                  <div className="space-y-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your browser's print dialog should open automatically. If it doesn't, click the button below.
                    </p>
                    <button
                      onClick={handlePrintClick}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Open Print Dialog
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePrintClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Print Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-3 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
