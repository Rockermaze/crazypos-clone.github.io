import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '../../../../lib/stripe'
import User from '../../../../models/User'
import Transaction from '../../../../models/Transaction'
import Sale from '../../../../models/Sale'
import Counter from '../../../../models/Counter'
import Product from '../../../../models/Product'
import connectDB from '../../../../lib/mongodb'

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
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    await connectDB()

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

    // Find existing transaction (created when PI was created)
    let transaction = await Transaction.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    })

    // If no transaction exists (edge case), create a minimal one so dashboards stay consistent
    if (!transaction) {
      console.warn('Transaction not found for payment intent, creating a minimal record:', paymentIntent.id)
      const userId = paymentIntent.metadata?.shopkeeperId
      if (!userId) {
        console.error('Cannot infer userId from payment intent metadata; skipping transaction creation')
        return
      }
      // Calculate fee from Stripe's application fee
      const amount = (paymentIntent.amount_received || paymentIntent.amount) / 100
      const applicationFee = paymentIntent.application_fee_amount ? paymentIntent.application_fee_amount / 100 : 0
      
      transaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        userId,
        saleId: null,
        amount,
        currency: (paymentIntent.currency || 'usd').toUpperCase(),
        type: 'SALE',
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentGateway: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        applicationFeeAmount: applicationFee,
        description: paymentIntent.description || `Stripe payment ${paymentIntent.id}`,
        customer: {
          email: paymentIntent.receipt_email || '',
          name: paymentIntent.metadata?.customerName || ''
        },
        fee: {
          amount: applicationFee,
          currency: (paymentIntent.currency || 'usd').toUpperCase(),
          type: 'PROCESSING_FEE'
        },
        netAmount: amount - applicationFee,
        metadata: {
          paymentIntentId: paymentIntent.id,
          source: 'stripe-webhook'
        }
      })
    }

    // Update transaction status and stripe details
    transaction.status = 'COMPLETED'
    transaction.processedAt = new Date()
    
    // Preserve or calculate fee if not already set
    if (!transaction.fee || transaction.fee.amount === 0) {
      // If fee wasn't set, recalculate from applicationFeeAmount or default to 0
      const feeAmount = transaction.applicationFeeAmount || 0
      transaction.fee = {
        amount: feeAmount,
        currency: transaction.currency || 'USD',
        type: 'PROCESSING_FEE'
      }
    }
    
    // Calculate accurate netAmount = amount - fee
    transaction.netAmount = transaction.amount - (transaction.fee?.amount || 0)
    
    transaction.metadata = {
      ...transaction.metadata,
      stripeChargeId: paymentIntent.latest_charge,
      // Note: receipt_email is an email address; receipt_url lives on the charge object
      receiptEmail: paymentIntent.receipt_email,
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown'
    }

    await transaction.save()
    console.log('Transaction updated successfully:', transaction.transactionId)

    // If no Sale is linked yet, create a Sale so it appears in Sales screens/reports
    if (!transaction.saleId) {
      const userId = transaction.userId

      // Ensure a counter exists and increment receipt number
      let counter = await Counter.findOne({ userId })
      if (!counter) {
        counter = new Counter({ userId, receiptNumber: 1000, ticketNumber: 1000, productId: 1000 })
        await counter.save()
      }
      counter.receiptNumber += 1
      await counter.save()
      const receiptNumber = `R${counter.receiptNumber}`

      // Find or create a non-inventory service product to attach the sale item to
      let serviceProduct = await Product.findOne({ userId, barcode: 'DIRECT_PAYMENT' })
      if (!serviceProduct) {
        serviceProduct = await new Product({
          userId,
          name: 'Direct Payment',
          price: 0,
          cost: 0,
          stock: 0,
          barcode: 'DIRECT_PAYMENT',
          category: 'Services',
          description: 'Non-inventory direct payment recorded via Stripe',
          isActive: true
        }).save()
      }

      const amount = transaction.amount
      const currency = transaction.currency || 'USD'

      const sale = new Sale({
        items: [{
          productId: serviceProduct._id,
          productName: serviceProduct.name,
          quantity: 1,
          unitPrice: amount,
          totalPrice: amount,
          discount: 0
        }],
        subtotal: amount,
        tax: 0,
        discount: 0,
        total: amount,
        paymentMethod: 'STRIPE',
        paymentGateway: 'STRIPE',
        paymentStatus: 'COMPLETED',
        transactionId: transaction._id,
        externalTransactionId: paymentIntent.id,
        paymentProcessedAt: new Date(),
        processingFee: {
          amount: transaction.fee?.amount || 0,
          currency
        },
        netAmount: transaction.netAmount || amount,
        currency,
        customerInfo: {
          name: transaction.customer?.name || '',
          email: transaction.customer?.email || '',
          phone: transaction.customer?.phone || ''
        },
        receiptNumber,
        cashierId: userId,
        userId
      })

      const savedSale = await sale.save()

      // Link the sale back to the transaction
      transaction.saleId = savedSale._id
      await transaction.save()

      console.log('Sale created and linked for Stripe payment:', savedSale.receiptNumber)
    }

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
