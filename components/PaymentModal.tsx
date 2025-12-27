'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  customerId?: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  stripeData?: {
    paymentIntentId?: string
    transactionId?: string
  }
  invoicePreferences?: {
    emailInvoice: boolean
    printInvoice: boolean
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
  const { data: session } = useSession()
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'STORE_CREDIT' | 'STRIPE'>('CASH')
  const [discount, setDiscount] = useState(0)
  
  // Calculate tax and final total
  const taxRate = 0.0825 // 8.25% - should come from settings
  const subtotal = total
  const discountAmount = (subtotal * discount) / 100
  const taxAmount = (subtotal - discountAmount) * taxRate
  const finalTotal = subtotal - discountAmount + taxAmount
  
  const [amountPaid, setAmountPaid] = useState(finalTotal)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [customerCreateError, setCustomerCreateError] = useState('')
  const [stripeError, setStripeError] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')
  const [emailValidationError, setEmailValidationError] = useState('')
  // Invoice preferences
  const [emailInvoice, setEmailInvoice] = useState(false)
  const [printInvoice, setPrintInvoice] = useState(false)
  // QR state
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [qrData, setQrData] = useState<null | {
    qrCode: string
    paymentUrl: string
    sessionId: string
    expiresAt: string
  }>(null)
  const [qrTimeRemaining, setQrTimeRemaining] = useState<number | null>(null)
  
  // Debounce customer search
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      if (customerInfo.phone && customerInfo.phone.length >= 3) {
        searchCustomer(customerInfo.phone)
      } else {
        setCustomerSearchResults([])
        setShowCustomerDropdown(false)
      }
    }, 300)
    
    return () => clearTimeout(delayTimer)
  }, [customerInfo.phone])
  
  const searchCustomer = async (contact: string) => {
    try {
      setIsSearchingCustomer(true)
      const response = await fetch(`/api/customers?contact=${encodeURIComponent(contact)}`)
      const data = await response.json()
      
      if (data.success && data.customer) {
        setCustomerSearchResults([data.customer])
        setShowCustomerDropdown(true)
      } else {
        setCustomerSearchResults([])
        setShowCustomerDropdown(false)
      }
    } catch (error) {
      console.error('Error searching customer:', error)
    } finally {
      setIsSearchingCustomer(false)
    }
  }
  
  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setCustomerInfo({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || ''
    })
    setShowCustomerDropdown(false)
    setShowNewCustomerForm(false)
  }
  
  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerInfo({ name: '', email: '', phone: '' })
    setCustomerSearchResults([])
    setShowNewCustomerForm(false)
  }
  
  const handleCreateNewCustomer = async () => {
    try {
      setIsCreatingCustomer(true)
      setCustomerCreateError('')
      
      // Validate required fields
      if (!customerInfo.name || !customerInfo.phone) {
        setCustomerCreateError('Name and phone are required')
        return
      }
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerInfo)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer')
      }
      
      if (data.success && data.customer) {
        // Select the newly created customer
        setSelectedCustomer(data.customer)
        setCustomerInfo({
          name: data.customer.name || '',
          email: data.customer.email || '',
          phone: data.customer.phone || ''
        })
        setShowNewCustomerForm(false)
        setCustomerCreateError('')
      }
    } catch (error: any) {
      setCustomerCreateError(error.message || 'Failed to create customer')
    } finally {
      setIsCreatingCustomer(false)
    }
  }
  
  const change = paymentMethod === 'CASH' ? Math.max(0, amountPaid - finalTotal) : 0
  
  // Update amountPaid when finalTotal changes (due to discount changes)
  useEffect(() => {
    setAmountPaid(finalTotal)
  }, [finalTotal])

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
      customerId: selectedCustomer?.id,
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined,
      stripeData: {
        paymentIntentId,
        transactionId: paymentIntentId
      },
      invoicePreferences: {
        emailInvoice,
        printInvoice
      }
    }

    onPaymentComplete(paymentData)
  }

  const handleStripePaymentError = (error: string) => {
    setStripeError(error)
    setStripeSuccess('')
  }

  // Generate QR Code for ONLINE method
  const handleGenerateQRCode = async () => {
    try {
      setQrLoading(true)
      setQrError('')
      setQrData(null)

      const shopkeeperId = (session?.user as any)?.id
      if (!shopkeeperId) {
        throw new Error('Unable to determine shopkeeper. Please re-login and try again.')
      }

      const response = await fetch('/api/payment/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopkeeperId,
          amount: Number(finalTotal.toFixed(2)),
          currency: 'usd',
          description: 'POS Transaction',
          expiresIn: 3600
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate QR code')
      }

      setQrData({
        qrCode: data.qrCode,
        paymentUrl: data.paymentUrl,
        sessionId: data.sessionId,
        expiresAt: data.expiresAt,
      })

    } catch (err: any) {
      setQrError(err.message || 'Failed to generate QR code')
    } finally {
      setQrLoading(false)
    }
  }

  // Countdown for QR expiration
  useEffect(() => {
    if (!qrData?.expiresAt) return

    const expirationTime = new Date(qrData.expiresAt).getTime()
    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, expirationTime - now)
      setQrTimeRemaining(remaining)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [qrData?.expiresAt])

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
      customerInfo: customerInfo.name || customerInfo.email || customerInfo.phone ? customerInfo : undefined,
      customerId: selectedCustomer?.id,
      invoicePreferences: {
        emailInvoice,
        printInvoice
      }
    } as any

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

        {/* Online (QR Code) Payment */}
        {paymentMethod === 'ONLINE' && (
          <div className="space-y-4">
            {!qrData && (
              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  Generate a QR code for the customer to scan and pay ${finalTotal.toFixed(2)} on their phone.
                </p>
                {qrError && (
                  <div className="mb-3 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                    {qrError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGenerateQRCode}
                  disabled={qrLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {qrLoading ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            )}

            {qrData && (
              <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                <div className="flex flex-col items-center gap-3">
                  <img src={qrData.qrCode} alt="Payment QR Code" className="w-48 h-48" />
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {qrTimeRemaining !== null && qrTimeRemaining > 0 ? (
                      <span>Expires in {formatTimeRemaining(qrTimeRemaining)}</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">QR code expired. Generate a new one.</span>
                    )}
                  </div>
                  <div className="w-full">
                    <label className="block text-xs text-slate-500 mb-1">Payment Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={qrData.paymentUrl}
                        className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(qrData.paymentUrl)}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Customer Information (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer Information (Optional)</h4>
            <div className="flex gap-2">
              {!selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  className="text-xs px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
                >
                  {showNewCustomerForm ? 'Cancel' : '+ New Customer'}
                </button>
              )}
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Clear Customer
                </button>
              )}
            </div>
          </div>
          
          {selectedCustomer && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{selectedCustomer.name}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">ID: {selectedCustomer.customerId}</p>
                  {selectedCustomer.dueAmount > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                      Due: ${selectedCustomer.dueAmount.toFixed(2)}
                    </p>
                  )}
                  {selectedCustomer.purchaseCount > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {selectedCustomer.purchaseCount} previous purchases (${selectedCustomer.totalPurchases.toFixed(2)} total)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* New Customer Form */}
          {showNewCustomerForm && !selectedCustomer && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Create New Customer</h5>
              </div>
              
              {customerCreateError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">{customerCreateError}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email (Optional - for invoice)
                  </label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={customerInfo.email}
                    onChange={(e) => {
                      const email = e.target.value
                      setCustomerInfo(prev => ({ ...prev, email }))
                      // Clear validation error when user types
                      if (emailValidationError) setEmailValidationError('')
                    }}
                    onBlur={() => {
                      // Validate email format on blur if provided
                      if (customerInfo.email && customerInfo.email.trim()) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        if (!emailRegex.test(customerInfo.email.trim())) {
                          setEmailValidationError('Invalid email format')
                        }
                      }
                    }}
                    className={`w-full rounded-lg border ${
                      emailValidationError 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500`}
                  />
                  {emailValidationError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{emailValidationError}</p>
                  )}
                  {customerInfo.email && !emailValidationError && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Invoice will be sent to this email</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleCreateNewCustomer}
                  disabled={isCreatingCustomer || !customerInfo.name || !customerInfo.phone}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          )}
          
          {!showNewCustomerForm && (
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Customer name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              disabled={!!selectedCustomer}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="relative">
              <input
                type="email"
                placeholder="Email (for invoice)"
                value={customerInfo.email}
                onChange={(e) => {
                  const email = e.target.value
                  setCustomerInfo(prev => ({ ...prev, email }))
                  if (emailValidationError) setEmailValidationError('')
                }}
                onBlur={() => {
                  if (customerInfo.email && customerInfo.email.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(customerInfo.email.trim())) {
                      setEmailValidationError('Invalid email format')
                    }
                  }
                }}
                disabled={!!selectedCustomer}
                className={`w-full rounded-xl border ${
                  emailValidationError 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-slate-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {emailValidationError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 absolute">{emailValidationError}</p>
              )}
            </div>
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone (search customers)"
                value={customerInfo.phone}
                onChange={(e) => {
                  setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))
                  setSelectedCustomer(null)
                }}
                disabled={!!selectedCustomer}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearchingCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {customerSearchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{customer.phone}</p>
                      {customer.dueAmount > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400">Due: ${customer.dueAmount.toFixed(2)}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Invoice Preferences */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">📄 Invoice Options</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailInvoice}
                onChange={(e) => setEmailInvoice(e.target.checked)}
                disabled={!customerInfo.email}
                className="w-4 h-4 rounded border-blue-300 dark:border-blue-600 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                📧 Email invoice to customer
                {!customerInfo.email && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">(Enter customer email above)</span>
                )}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={printInvoice}
                onChange={(e) => setPrintInvoice(e.target.checked)}
                className="w-4 h-4 rounded border-blue-300 dark:border-blue-600 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="text-sm text-blue-800 dark:text-blue-200">🖨️ Print invoice after payment</span>
            </label>
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
