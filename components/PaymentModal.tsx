'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Modal } from '@/components/Modal'
import { SaleItem } from '@/types'

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  paymentMethod: 'CASH' | 'ONLINE' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'STORE_CREDIT' | 'STRIPE'
  paymentGateway?: 'MANUAL' | 'STRIPE'
  amountPaid: number
  change: number
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  stripeData?: {
    paymentIntentId?: string
    transactionId?: string
  }
}


// Stripe Payment Component
function StripePaymentForm({ finalTotal, customerInfo, onPaymentSuccess, onPaymentError }: {
  finalTotal: number
  customerInfo: any
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onPaymentError('Stripe not loaded')
      return
    }

    setProcessing(true)
    
    try {
      // Create payment intent on your server
      const response = await fetch('/api/stripe/pos-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          currency: 'usd',
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          description: 'POS Transaction'
        })
      })

      const { clientSecret, paymentIntentId } = await response.json()

      if (!clientSecret) {
        throw new Error('Failed to create payment intent')
      }

      // Confirm payment with card
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name || undefined,
            email: customerInfo.email || undefined,
          },
        }
      })

      if (error) {
        onPaymentError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
      }
    } catch (error: any) {
      onPaymentError(error.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleStripePayment}
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? 'Processing...' : `Pay $${finalTotal.toFixed(2)} with Card`}
      </button>
    </div>
  )
}

export function PaymentModal({ isOpen, onClose, onPaymentComplete, cartItems, total }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'STORE_CREDIT' | 'STRIPE'>('CASH')
  const [amountPaid, setAmountPaid] = useState(total)
  const [discount, setDiscount] = useState(0)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [stripeError, setStripeError] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')
  
  const taxRate = 0.0825 // 8.25% - should come from settings
  const subtotal = total
  const discountAmount = (subtotal * discount) / 100
  const taxAmount = (subtotal - discountAmount) * taxRate
  const finalTotal = subtotal - discountAmount + taxAmount
  const change = paymentMethod === 'CASH' ? Math.max(0, amountPaid - finalTotal) : 0

  // Stripe payment handlers
  const handleStripePaymentSuccess = (paymentIntentId: string) => {
    setStripeSuccess('Payment successful!')
    setStripeError('')
    
    const paymentData: PaymentData = {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod: 'STRIPE',
      paymentGateway: 'STRIPE',
      amountPaid: finalTotal,
      change: 0,
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined,
      stripeData: {
        paymentIntentId,
        transactionId: paymentIntentId
      }
    }

    onPaymentComplete(paymentData)
  }

  const handleStripePaymentError = (error: string) => {
    setStripeError(error)
    setStripeSuccess('')
  }

  const handlePaymentComplete = () => {

    const paymentData: PaymentData = {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      paymentGateway: 'MANUAL',
      amountPaid: paymentMethod === 'CASH' ? amountPaid : finalTotal,
      change,
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined
    }

    onPaymentComplete(paymentData)
  }

  const isValidPayment = (
    paymentMethod !== 'CASH' || 
    amountPaid >= finalTotal
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment">
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {cartItems.map(item => (
              <div key={item.productId} className="flex justify-between">
                <span>{item.productName} × {item.quantity}</span>
                <span>${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-600 pt-2 text-slate-900 dark:text-slate-100">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'CASH', label: 'Cash', icon: '💵' },
              { value: 'STRIPE', label: 'Card (Stripe)', icon: '💳' },
              { value: 'ONLINE', label: 'Online', icon: '🌐' },
              { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
              { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
              { value: 'STORE_CREDIT', label: 'Shop Credits', icon: '🎫' }
            ].map(method => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value as any)}
                className={`p-3 rounded-xl border text-center transition-colors ${
                  paymentMethod === method.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
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
          <label htmlFor="discount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
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
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="0"
          />
        </div>

        {/* Cash Payment Amount */}
        {paymentMethod === 'CASH' && (
          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount Paid ($)
            </label>
            <input
              type="number"
              id="amountPaid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="0.00"
            />
            {change > 0 && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Change: <span className="font-bold">${change.toFixed(2)}</span>
              </p>
            )}
            {amountPaid < finalTotal && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Insufficient payment. Need ${(finalTotal - amountPaid).toFixed(2)} more.
              </p>
            )}
          </div>
        )}

        {/* Stripe Payment */}
        {paymentMethod === 'STRIPE' && (
          <div>
            <Elements stripe={stripePromise}>
              <StripePaymentForm 
                finalTotal={finalTotal}
                customerInfo={customerInfo}
                onPaymentSuccess={handleStripePaymentSuccess}
                onPaymentError={handleStripePaymentError}
              />
            </Elements>
            {stripeError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{stripeError}</p>
              </div>
            )}
            {stripeSuccess && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">{stripeSuccess}</p>
              </div>
            )}
          </div>
        )}


        {/* Customer Information (Optional) */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Customer Information (Optional)</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Customer name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={`${paymentMethod === 'STRIPE' ? 'w-full' : 'flex-1'} rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800`}
          >
            Cancel
          </button>
          {paymentMethod !== 'STRIPE' && (
            <button
              type="button"
              onClick={handlePaymentComplete}
              disabled={!isValidPayment}
              className="flex-1 rounded-xl px-4 py-2 font-medium transition-colors bg-brand-700 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Payment
            </button>
          )}
        </div>
      </div>
      
    </Modal>
  )
}
