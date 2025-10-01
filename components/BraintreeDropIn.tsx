'use client'
import { useEffect, useRef, useState } from 'react'
import dropin from 'braintree-web-drop-in'

interface Props {
  amount: number
  onPaid: (result: {
    transactionId: string
    status: string
    paymentInstrumentType: string
  }) => void
}

export default function BraintreeDropIn({ amount, onPaid }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [instance, setInstance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    let currentInstance: any = null

    async function setup() {
      try {
        // Ensure container is available and empty
        if (!containerRef.current) {
          setError('Payment container not ready')
          return
        }

        // Clear any existing content in the container
        containerRef.current.innerHTML = ''

        const tokenRes = await fetch('/api/braintree/client-token')
        const tokenJson = await tokenRes.json()
        if (!tokenJson.success) throw new Error('Failed to get client token')

        const inst = await dropin.create({
          authorization: tokenJson.clientToken,
          container: containerRef.current,
          card: { vault: false },
          paypal: {
            flow: 'checkout',
            amount: Number(amount).toFixed(2),
            currency: 'USD',
          },
          googlePay: {
            merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID,
            transactionInfo: {
              currencyCode: 'USD',
              totalPriceStatus: 'FINAL',
              totalPrice: Number(amount).toFixed(2),
            },
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'],
              },
            }],
          },
        })
        
        if (mounted) {
          currentInstance = inst
          setInstance(inst)
          setError(null)
        } else {
          // Component unmounted during setup, cleanup immediately
          inst.teardown().catch(() => {})
        }
      } catch (e: any) {
        console.error('Drop-in setup error', e)
        if (mounted) {
          setError(e.message || 'Failed to load payment form')
        }
      }
    }

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(setup, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (currentInstance) {
        currentInstance.teardown().catch(() => {})
        currentInstance = null
      }
      setInstance(null)
    }
  }, [amount])

  const pay = async () => {
    if (!instance) return
    setLoading(true)
    setError(null)
    try {
      const payload = await instance.requestPaymentMethod({})
      const res = await fetch('/api/braintree/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethodNonce: payload.nonce,
          deviceData: payload.deviceData,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Payment failed')
      onPaid({
        transactionId: json.data.transactionId,
        status: json.data.status,
        paymentInstrumentType: json.data.paymentInstrumentType,
      })
    } catch (e: any) {
      setError(e.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div ref={containerRef} />
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <button
        disabled={!instance || loading}
        onClick={pay}
        className="mt-4 rounded-xl px-4 py-2 bg-brand-700 text-white disabled:opacity-50"
      >
        {loading ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
      </button>
    </div>
  )
}