'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import type { RepairTicket } from '@/types/repair'

interface RepairPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (paymentData: {
    paymentStatus: 'unpaid' | 'partial' | 'paid'
    paidAmount: number
    paymentMethod: 'cash' | 'card' | 'upi' | 'bank-transfer' | 'other'
    paymentNotes: string
  }) => void
  repair: RepairTicket
}

export function RepairPaymentModal({ isOpen, onClose, onSave, repair }: RepairPaymentModalProps) {
  const [formData, setFormData] = useState({
    paidAmount: 0,
    paymentMethod: 'cash' as const,
    paymentNotes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && repair) {
      setFormData({
        paidAmount: repair.paidAmount || 0,
        paymentMethod: repair.paymentMethod || 'cash',
        paymentNotes: repair.paymentNotes || ''
      })
    }
  }, [isOpen, repair])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.paidAmount < 0) {
      newErrors.paidAmount = 'Amount cannot be negative'
    }

    if (formData.paidAmount > repair.estimatedCost) {
      newErrors.paidAmount = `Amount cannot exceed estimated cost ($${repair.estimatedCost.toFixed(2)})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Determine payment status based on amount
      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
      if (formData.paidAmount >= repair.estimatedCost) {
        paymentStatus = 'paid'
      } else if (formData.paidAmount > 0) {
        paymentStatus = 'partial'
      }

      onSave({
        ...formData,
        paymentStatus
      })
    }
  }

  const remainingAmount = repair.estimatedCost - formData.paidAmount

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repair Summary */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Repair Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Ticket:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{repair.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Customer:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{repair.customerInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Estimated Cost:</span>
              <span className="font-medium text-brand-700 dark:text-brand-400">${repair.estimatedCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Previously Paid:</span>
              <span className="font-medium text-green-700 dark:text-green-400">${repair.paidAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label htmlFor="paidAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Payment Amount * ($)
          </label>
          <input
            type="number"
            id="paidAmount"
            name="paidAmount"
            value={formData.paidAmount}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            max={repair.estimatedCost}
            className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
              errors.paidAmount 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
            }`}
            placeholder="0.00"
          />
          {errors.paidAmount && <p className="mt-1 text-xs text-red-600">{errors.paidAmount}</p>}
          
          {formData.paidAmount > 0 && (
            <div className="mt-2 text-sm">
              {remainingAmount > 0 ? (
                <p className="text-orange-600 dark:text-orange-400">
                  Remaining: <span className="font-semibold">${remainingAmount.toFixed(2)}</span>
                </p>
              ) : (
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  ✓ Fully Paid
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Payment Method *
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank-transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Payment Notes */}
        <div>
          <label htmlFor="paymentNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="paymentNotes"
            name="paymentNotes"
            value={formData.paymentNotes}
            onChange={handleInputChange}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Additional payment notes..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
          >
            Record Payment
          </button>
        </div>
      </form>
    </Modal>
  )
}
