import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'

// POST /api/stripe/pos-payment - Create payment intent for POS transactions
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'usd', 
      customerEmail,
      customerName,
      description = 'POS Transaction'
    } = body

    // Validate required fields
    if (!amount || amount < 0.50) {
      return NextResponse.json({ 
        error: 'Amount must be at least $0.50' 
      }, { status: 400 })
    }

    // Create payment intent directly (not using Connect since this is for your own account)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer_email: customerEmail,
      description,
      metadata: {
        source: 'pos_system',
        customerName: customerName || '',
        customerEmail: customerEmail || ''
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    })

  } catch (error) {
    console.error('Error creating POS payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error.message },
      { status: 500 }
    )
  }
}