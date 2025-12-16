'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { 
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Clock,
  QrCode
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

// Make sure to call `loadStripe` outside of a component's render to avoid recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Shopkeeper {
  id: string
  businessName: string
  email: string
  stripeAccountStatus: string
}

interface PaymentFormProps {
  shopkeeper: Shopkeeper
  prefilledAmount?: string
  prefilledDescription?: string
  sessionId?: string
  expiresAt?: string
}

function PaymentForm({ shopkeeper, prefilledAmount, prefilledDescription, sessionId, expiresAt }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState(prefilledAmount || '')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [description, setDescription] = useState(prefilledDescription || '')
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // Timer effect for expiration
  useEffect(() => {
    if (!expiresAt) return

    const expirationTime = new Date(expiresAt).getTime()
    const now = Date.now()
    
    if (now >= expirationTime) {
      setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      const currentTime = Date.now()
      const remaining = expirationTime - currentTime
      
      if (remaining <= 0) {
        setIsExpired(true)
        setTimeRemaining(0)
        clearInterval(timer)
      } else {
        setTimeRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!amount || parseFloat(amount) < 0.50) {
      setErrorMessage('Amount must be at least $0.50')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')
    setErrorMessage('')

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'usd',
          shopkeeperId: shopkeeper.id,
          customerEmail: customerEmail || undefined,
          customerName: customerName || undefined,
          description: description || `Payment to ${shopkeeper.businessName}`,
          metadata: {
            paymentType: 'direct_payment'
          }
        })
      })

      const paymentData = await response.json()

      if (!response.ok) {
        throw new Error(paymentData.error || 'Failed to create payment intent')
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName || undefined,
              email: customerEmail || undefined,
            },
          }
        }
      )

      if (error) {
        setPaymentStatus('error')
        setErrorMessage(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('success')
      }
    } catch (error: any) {
      setPaymentStatus('error')
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Show expiration error
  if (isExpired) {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Link Expired</h2>
          <p className="text-gray-600 mb-4">
            This payment link has expired. Please request a new payment link from the merchant.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your payment of ${amount} to {shopkeeper.businessName} has been processed successfully.
          </p>
          <p className="text-sm text-gray-500">
            You should receive a receipt via email if provided.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* QR Code Session Info */}
      {sessionId && (
        <Alert className="bg-blue-50 border-blue-200">
          <QrCode className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>Payment initiated via QR code</span>
              {timeRemaining && timeRemaining > 0 && (
                <span className="font-mono text-sm">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimeRemaining(timeRemaining)}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Your Name (Optional)</Label>
          <Input
            id="customerName"
            type="text"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="customerEmail">Your Email (Optional)</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="john@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.50"
          placeholder="10.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="What is this payment for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <Label>Card Details</Label>
        <div className="mt-1 p-3 border rounded-md">
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

      {errorMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading || paymentStatus === 'processing'}
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay $${amount || '0.00'}`}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Secured by Stripe • Platform fee: 1.5%</p>
        <p>You will be charged ${((parseFloat(amount) || 0) + ((parseFloat(amount) || 0) * 0.029 + 0.30)).toFixed(2)} (includes Stripe fees)</p>
      </div>
    </form>
    </div>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const shopkeeperId = params.shopkeeperId as string
  const searchParams = useSearchParams()
  const [shopkeeper, setShopkeeper] = useState<Shopkeeper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Extract QR params (if present)
  const prefilledAmount = searchParams?.get('amount') || undefined
  const prefilledDescription = searchParams?.get('description') || undefined
  const sessionId = searchParams?.get('session') || undefined
  const expires = searchParams?.get('expires') || undefined
  // Convert epoch millis to ISO if provided
  const expiresAt = expires ? new Date(Number(expires)).toISOString() : undefined

  useEffect(() => {
    fetchShopkeeper()
  }, [shopkeeperId])

  const fetchShopkeeper = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${shopkeeperId}`)
      
      if (response.ok) {
        const userData = await response.json()
        
        if (userData.stripeAccountStatus !== 'active') {
          setError('This merchant is not currently accepting online payments.')
          return
        }

        setShopkeeper(userData)
      } else {
        setError('Merchant not found or payment processing unavailable.')
      }
    } catch (error) {
      console.error('Error fetching shopkeeper:', error)
      setError('Unable to load payment information.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payment Unavailable</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shopkeeper) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Pay {shopkeeper.businessName}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{shopkeeper.email}</p>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <PaymentForm 
                shopkeeper={shopkeeper}
                prefilledAmount={prefilledAmount}
                prefilledDescription={prefilledDescription}
                sessionId={sessionId}
                expiresAt={expiresAt}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}