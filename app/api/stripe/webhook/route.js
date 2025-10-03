import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '../../../../lib/stripe'
import User from '../../../../models/User'
import Transaction from '../../../../models/Transaction'
import { connectToDatabase } from '../../../../lib/mongodb'

// This is your webhook secret for verifying the webhook signature
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
        
      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object)
        break
        
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Payment intent succeeded:', paymentIntent.id)

    // Update transaction status
    const transaction = await Transaction.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    })

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id)
      return
    }

    transaction.status = 'COMPLETED'
    transaction.processedAt = new Date()
    transaction.metadata = {
      ...transaction.metadata,
      stripeChargeId: paymentIntent.latest_charge,
      stripeReceiptUrl: paymentIntent.receipt_email,
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown'
    }

    await transaction.save()
    console.log('Transaction updated successfully:', transaction.transactionId)

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Payment intent failed:', paymentIntent.id)

    // Update transaction status
    const transaction = await Transaction.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    })

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id)
      return
    }

    transaction.status = 'FAILED'
    transaction.metadata = {
      ...transaction.metadata,
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
      failureCode: paymentIntent.last_payment_error?.code || 'unknown'
    }

    await transaction.save()
    console.log('Transaction marked as failed:', transaction.transactionId)

  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('Payment intent canceled:', paymentIntent.id)

    // Update transaction status
    const transaction = await Transaction.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    })

    if (!transaction) {
      console.error('Transaction not found for payment intent:', paymentIntent.id)
      return
    }

    transaction.status = 'CANCELLED'
    transaction.metadata = {
      ...transaction.metadata,
      canceledAt: new Date().toISOString(),
      cancellationReason: paymentIntent.cancellation_reason || 'unknown'
    }

    await transaction.save()
    console.log('Transaction canceled:', transaction.transactionId)

  } catch (error) {
    console.error('Error handling payment intent canceled:', error)
  }
}

async function handleAccountUpdated(account) {
  try {
    console.log('Account updated:', account.id)

    // Find user with this Stripe account
    const user = await User.findOne({ stripeAccountId: account.id })
    if (!user) {
      console.error('User not found for account:', account.id)
      return
    }

    // Update account status
    const accountStatus = account.charges_enabled && account.payouts_enabled ? 'active' : 
                         account.requirements.disabled_reason ? 'restricted' : 'pending'

    user.stripeAccountStatus = accountStatus
    user.stripeChargesEnabled = account.charges_enabled
    user.stripePayoutsEnabled = account.payouts_enabled

    await user.save()
    console.log('User account status updated:', user.email, accountStatus)

  } catch (error) {
    console.error('Error handling account updated:', error)
  }
}

async function handleChargeDispute(dispute) {
  try {
    console.log('Charge dispute created:', dispute.id)

    // Find transaction by charge ID
    const transaction = await Transaction.findOne({ 
      'metadata.stripeChargeId': dispute.charge 
    })

    if (!transaction) {
      console.error('Transaction not found for charge:', dispute.charge)
      return
    }

    transaction.metadata = {
      ...transaction.metadata,
      disputeId: dispute.id,
      disputeStatus: dispute.status,
      disputeReason: dispute.reason,
      disputeAmount: dispute.amount,
      disputeCreatedAt: new Date(dispute.created * 1000).toISOString()
    }

    await transaction.save()
    console.log('Dispute information added to transaction:', transaction.transactionId)

  } catch (error) {
    console.error('Error handling charge dispute:', error)
  }
}

// Disable body parser for webhooks
export const runtime = 'nodejs'