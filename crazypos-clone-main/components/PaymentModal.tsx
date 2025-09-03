'use client'
import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { SaleItem } from '@/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: (paymentData: PaymentData) => void
  cartItems: SaleItem[]
  total: number
}

export interface PaymentData {
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Transfer' | 'Store Credit' | 'Square'
  amountPaid: number
  change: number
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export function PaymentModal({ isOpen, onClose, onPaymentComplete, cartItems, total }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online' | 'Transfer' | 'Store Credit' | 'Square'>('Cash')
  const [amountPaid, setAmountPaid] = useState(total)
  const [discount, setDiscount] = useState(0)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const taxRate = 0.0825 // 8.25% - should come from settings
  const subtotal = total
  const discountAmount = (subtotal * discount) / 100
  const taxAmount = (subtotal - discountAmount) * taxRate
  const finalTotal = subtotal - discountAmount + taxAmount
  const change = paymentMethod === 'Cash' ? Math.max(0, amountPaid - finalTotal) : 0

  const handlePaymentComplete = () => {
    const paymentData: PaymentData = {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'Cash' ? amountPaid : finalTotal,
      change,
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined
    }

    onPaymentComplete(paymentData)
  }

  const isValidPayment = paymentMethod !== 'Cash' || amountPaid >= finalTotal

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment">
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {cartItems.map(item => (
              <div key={item.productId} className="flex justify-between">
                <span>{item.productName} × {item.quantity}</span>
                <span>${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'Cash', label: 'Cash', icon: '💵' },
              { value: 'Card', label: 'Card', icon: '💳' },
              { value: 'Online', label: 'Online', icon: '🌐' },
              { value: 'Transfer', label: 'Transfer', icon: '🏦' },
              { value: 'Store Credit', label: 'Store Credit', icon: '🎟️' },
              { value: 'Square', label: 'Square', icon: '⬜' }
            ].map(method => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value as any)}
                className={`p-3 rounded-xl border text-center transition-colors ${
                  paymentMethod === method.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <div className="text-2xl mb-1">{method.icon}</div>
                <div className="text-sm font-medium">{method.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Discount */}
        <div>
          <label htmlFor="discount" className="block text-sm font-medium text-slate-700 mb-1">
            Discount (%)
          </label>
          <input
            type="number"
            id="discount"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
            min="0"
            max="100"
            step="0.1"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="0"
          />
        </div>

        {/* Cash Payment Amount */}
        {paymentMethod === 'Cash' && (
          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-slate-700 mb-1">
              Amount Paid ($)
            </label>
            <input
              type="number"
              id="amountPaid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="0.00"
            />
            {change > 0 && (
              <p className="mt-2 text-sm text-green-600">
                Change: <span className="font-bold">${change.toFixed(2)}</span>
              </p>
            )}
            {amountPaid < finalTotal && (
              <p className="mt-2 text-sm text-red-600">
                Insufficient payment. Need ${(finalTotal - amountPaid).toFixed(2)} more.
              </p>
            )}
          </div>
        )}

        {/* Customer Information (Optional) */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Customer Information (Optional)</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Customer name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
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
            type="button"
            onClick={handlePaymentComplete}
            disabled={!isValidPayment}
            className="flex-1 rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Payment
          </button>
        </div>
      </div>
    </Modal>
  )
}
