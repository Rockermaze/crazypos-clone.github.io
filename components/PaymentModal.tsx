'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { SaleItem } from '@/types'
import Script from 'next/script'
import dynamic from 'next/dynamic'

const BraintreeDropIn = dynamic(() => import('@/components/BraintreeDropIn'), { ssr: false })

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
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'SQUARE' | 'CHECK'
  paymentGateway?: 'PAYPAL' | 'STRIPE' | 'SQUARE' | 'MANUAL' | 'BRAINTREE'
  braintreeData?: {
    transactionId?: string
    paymentInstrumentType?: string
  }
  amountPaid: number
  change: number
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  paypalData?: {
    orderId?: string
    captureId?: string
    transactionId?: string
  }
}

// PayPal types
declare global {
  interface Window {
    paypal?: any
  }
}

export function PaymentModal({ isOpen, onClose, onPaymentComplete, cartItems, total }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'SQUARE' | 'CHECK' | 'BRAINTREE'>('CASH')
  const [amountPaid, setAmountPaid] = useState(total)
  const [discount, setDiscount] = useState(0)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  // PayPal state
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [currentPaypalOrder, setCurrentPaypalOrder] = useState<any>(null)

  const taxRate = 0.0825 // 8.25% - should come from settings
  const subtotal = total
  const discountAmount = (subtotal * discount) / 100
  const taxAmount = (subtotal - discountAmount) * taxRate
  const finalTotal = subtotal - discountAmount + taxAmount
  const change = paymentMethod === 'CASH' ? Math.max(0, amountPaid - finalTotal) : 0

  // PayPal setup effect
  useEffect(() => {
    if (isOpen && paymentMethod === 'PAYPAL' && window.paypal && !paypalLoaded) {
      setPaypalLoaded(true)
      renderPayPalButtons()
    }
  }, [isOpen, paymentMethod, paypalLoaded, finalTotal])

  // Reset PayPal state when modal closes or payment method changes
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'PAYPAL') {
      setPaypalError(null)
      setPaypalProcessing(false)
      setCurrentPaypalOrder(null)
      if (paymentMethod !== 'PAYPAL') {
        setPaypalLoaded(false)
      }
    }
  }, [isOpen, paymentMethod])

  // Create PayPal order
  const createPayPalOrder = async () => {
    try {
      setPaypalError(null)
      setPaypalProcessing(true)

      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: finalTotal,
          currency: 'USD',
          description: `Purchase from YourPOS - ${cartItems.length} items`,
          customer: {
            name: customerInfo.name,
            firstName: customerInfo.name?.split(' ')[0] || '',
            lastName: customerInfo.name?.split(' ').slice(1).join(' ') || '',
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          metadata: {
            cartItems: cartItems.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            })),
            subtotal,
            tax: taxAmount,
            discount: discountAmount
          }
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create PayPal order')
      }

      setCurrentPaypalOrder(data.data)
      return data.data.paypalOrderId

    } catch (error: any) {
      console.error('PayPal Create Order Error:', error)
      setPaypalError(error.message || 'Failed to create PayPal order')
      setPaypalProcessing(false)
      throw error
    }
  }

  // Capture PayPal order
  const capturePayPalOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          transactionId: currentPaypalOrder?.transactionId
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to capture PayPal payment')
      }

      // Complete the payment
      const paymentData: PaymentData = {
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total: finalTotal,
        paymentMethod: 'PAYPAL',
        paymentGateway: 'PAYPAL',
        amountPaid: finalTotal,
        change: 0,
        customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined,
        paypalData: {
          orderId,
          captureId: data.data.captureId,
          transactionId: data.data.transactionId
        }
      }

      onPaymentComplete(paymentData)

    } catch (error: any) {
      console.error('PayPal Capture Error:', error)
      setPaypalError(error.message || 'Failed to capture PayPal payment')
      setPaypalProcessing(false)
    }
  }

  // Render PayPal buttons
  const renderPayPalButtons = () => {
    if (!window.paypal) return

    const paypalContainer = document.getElementById('paypal-button-container')
    if (!paypalContainer) return

    // Clear existing buttons
    paypalContainer.innerHTML = ''

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },
      createOrder: createPayPalOrder,
      onApprove: async (data: any) => {
        await capturePayPalOrder(data.orderID)
      },
      onError: (err: any) => {
        console.error('PayPal Button Error:', err)
        setPaypalError('PayPal payment failed. Please try again.')
        setPaypalProcessing(false)
      },
      onCancel: () => {
        setPaypalProcessing(false)
        setPaypalError('PayPal payment was cancelled')
      }
    }).render('#paypal-button-container')
  }

  const handlePaymentComplete = () => {
    if (paymentMethod === 'PAYPAL') {
      // PayPal payments are handled by the PayPal buttons
      return
    }

    const paymentData: PaymentData = {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      paymentGateway: paymentMethod === 'SQUARE' ? 'SQUARE' : 'MANUAL',
      amountPaid: paymentMethod === 'CASH' ? amountPaid : finalTotal,
      change,
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined
    }

    onPaymentComplete(paymentData)
  }

  const isValidPayment = (
    paymentMethod === 'PAYPAL' || 
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
              { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
              { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
              { value: 'PAYPAL', label: 'PayPal', icon: '🅿️' },
              { value: 'BRAINTREE', label: 'Card/PayPal/Google Pay (Braintree)', icon: '🧩' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
              { value: 'STORE_CREDIT', label: 'Store Credit', icon: '🎟️' },
              { value: 'SQUARE', label: 'Square', icon: '⬜' },
              { value: 'CHECK', label: 'Check', icon: '📝' }
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

        {/* Braintree Payment */}
        {paymentMethod === 'BRAINTREE' && (
          <div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Braintree Payment - ${finalTotal.toFixed(2)}
              </h4>
              <BraintreeDropIn
                amount={finalTotal}
                onPaid={(bt) => {
                  const method: PaymentData['paymentMethod'] = bt.paymentInstrumentType?.includes('paypal') ? 'PAYPAL' : 'CREDIT_CARD'
                  const paymentData: PaymentData = {
                    subtotal,
                    tax: taxAmount,
                    discount: discountAmount,
                    total: finalTotal,
                    paymentMethod: method,
                    paymentGateway: 'BRAINTREE',
                    amountPaid: finalTotal,
                    change: 0,
                    customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined,
                    braintreeData: {
                      transactionId: bt.transactionId,
                      paymentInstrumentType: bt.paymentInstrumentType,
                    }
                  }
                  onPaymentComplete(paymentData)
                }}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                Pay securely with cards, PayPal, or Google Pay via Braintree.
              </p>
            </div>
          </div>
        )}

        {/* PayPal Payment */}
        {paymentMethod === 'PAYPAL' && (
          <div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                PayPal Payment - ${finalTotal.toFixed(2)}
              </h4>
              
              {paypalError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{paypalError}</p>
                </div>
              )}
              
              {paypalProcessing && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-400">Processing PayPal payment...</p>
                </div>
              )}
              
              <div className="mb-4">
                <div id="paypal-button-container"></div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                You will be redirected to PayPal to complete the payment securely.
              </p>
            </div>
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
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePaymentComplete}
            disabled={!isValidPayment || paymentMethod === 'PAYPAL' || paymentMethod === 'BRAINTREE'}
            className={`flex-1 rounded-xl px-4 py-2 font-medium transition-colors ${
              paymentMethod === 'PAYPAL' 
                ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-brand-700 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {paymentMethod === 'PAYPAL' || paymentMethod === 'BRAINTREE' ? 'Use Payment Button Above' : 'Complete Payment'}
          </button>
        </div>
      </div>
      
      {/* PayPal SDK Script (only load when needed) */}
      {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && paymentMethod === 'PAYPAL' && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`}
          strategy="lazyOnload"
          onLoad={() => {
            console.log('PayPal SDK loaded')
            if (paymentMethod === 'PAYPAL' && isOpen) {
              setPaypalLoaded(true)
              setTimeout(renderPayPalButtons, 100)
            }
          }}
          onError={(e) => {
            console.error('PayPal SDK failed to load', e)
            setPaypalError('PayPal SDK failed to load. Please refresh the page and try again.')
          }}
        />
      )}
    </Modal>
  )
}
