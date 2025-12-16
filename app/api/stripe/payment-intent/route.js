import { NextResponse } from 'next/server'
import User from '../../../../models/User'
import Transaction from '../../../../models/Transaction'
import connectDB from '../../../../lib/mongodb'
import { createPaymentIntent, calculatePlatformFee } from '../../../../lib/stripe'

// POST /api/stripe/payment-intent - Create payment intent
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'usd', 
      shopkeeperId,
      customerEmail,
      customerName,
      description,
      saleId,
      metadata = {}
    } = body

    // Validate required fields
    if (!amount || !shopkeeperId) {
      return NextResponse.json({ 
        error: 'Amount and shopkeeper ID are required' 
      }, { status: 400 })
    }

    if (amount < 0.50) {
      return NextResponse.json({ 
        error: 'Amount must be at least $0.50' 
      }, { status: 400 })
    }

    await connectDB()

    // Get shopkeeper details
    const shopkeeper = await User.findById(shopkeeperId)
    if (!shopkeeper) {
      return NextResponse.json({ error: 'Shopkeeper not found' }, { status: 404 })
    }

    if (!shopkeeper.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Shopkeeper has not set up payment processing' 
      }, { status: 400 })
    }

    if (shopkeeper.stripeAccountStatus !== 'active') {
      return NextResponse.json({ 
        error: 'Shopkeeper payment account is not active' 
      }, { status: 400 })
    }

    // Calculate platform fee
    const platformFeeAmount = calculatePlatformFee(amount, shopkeeper.platformFeePercentage)
    const shopkeeperAmount = amount - platformFeeAmount

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        currency: currency.toLowerCase(),
        connectedAccountId: shopkeeper.stripeAccountId,
        platformFeeAmount,
        customerEmail,
        description: description || `Payment to ${shopkeeper.businessName}`,
        metadata: {
          shopkeeperId: shopkeeper._id.toString(),
          shopkeeperName: shopkeeper.businessName,
          saleId: saleId || '',
          ...metadata
        }
      })

      // Create transaction record
      const transactionData = {
        transactionId: Transaction.generateTransactionId(),
        userId: shopkeeper._id,
        saleId: saleId || null,
        amount,
        currency: currency.toUpperCase(),
        type: 'SALE',
        status: 'PENDING',
        paymentMethod: 'STRIPE',
        paymentGateway: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        stripeAccountId: shopkeeper.stripeAccountId,
        applicationFeeAmount: platformFeeAmount,
        transferAmount: shopkeeperAmount,
        description: description || `Payment to ${shopkeeper.businessName}`,
        customer: {
          email: customerEmail || '',
          name: customerName || ''
        },
        fee: {
          amount: platformFeeAmount,
          currency: currency.toUpperCase(),
          type: 'PROCESSING_FEE'
        },
        metadata: {
          paymentIntentId: paymentIntent.id,
          ...metadata
        }
      }

      const transaction = new Transaction(transactionData)
      await transaction.save()

      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        },
        transaction: {
          id: transaction._id,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          platformFee: platformFeeAmount,
          shopkeeperAmount: shopkeeperAmount
        },
        shopkeeper: {
          businessName: shopkeeper.businessName,
          email: shopkeeper.email
        }
      })

    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json(
        { error: 'Failed to create payment intent', details: stripeError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/stripe/payment-intent?paymentIntentId=pi_xxx - Get payment intent status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 })
    }

    await connectDB()

    // Find transaction by payment intent ID
    const transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId })
      .populate('userId', 'businessName email')

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transaction: transaction.toAPIResponse(),
      shopkeeper: {
        businessName: transaction.userId.businessName,
        email: transaction.userId.email
      }
    })

  } catch (error) {
    console.error('Error getting payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to get payment intent', details: error.message },
      { status: 500 }
    )
  }
}