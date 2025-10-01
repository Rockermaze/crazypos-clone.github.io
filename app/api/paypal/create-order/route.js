import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createPayPalOrder, calculatePayPalFees } from '@/lib/paypal'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * POST /api/paypal/create-order
 * Creates a PayPal order for payment processing
 */
export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      amount,
      currency = 'USD',
      description = 'Purchase from YourPOS',
      saleId,
      customer = {},
      metadata = {}
    } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Generate transaction ID
    const transactionId = Transaction.generateTransactionId()

    // Calculate PayPal fees
    const feeCalculation = calculatePayPalFees(amount, currency)

    // Create PayPal order
    const orderData = {
      amount,
      currency,
      description,
      referenceId: transactionId,
      customer,
      returnUrl: `${process.env.NEXTAUTH_URL}/api/paypal/success`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/api/paypal/cancel`
    }

    const paypalResponse = await createPayPalOrder(orderData)

    if (!paypalResponse.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create PayPal order',
          details: paypalResponse.error 
        },
        { status: 400 }
      )
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId,
      paypalOrderId: paypalResponse.orderId,
      userId: session.user.id,
      saleId: saleId || null,
      amount,
      currency,
      type: 'PAYMENT',
      status: 'PENDING',
      paymentMethod: 'PAYPAL',
      paymentGateway: 'PAYPAL',
      description,
      notes: `PayPal order created - Order ID: ${paypalResponse.orderId}`,
      fee: {
        amount: feeCalculation.totalFee,
        currency,
        type: 'GATEWAY_FEE'
      },
      netAmount: feeCalculation.netAmount,
      customer: {
        name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email,
        phone: customer.phone
      },
      paypalData: paypalResponse.data,
      metadata: {
        ...metadata,
        feeCalculation,
        userAgent: request.headers.get('user-agent'),
        createdVia: 'paypal-api'
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    })

    await transaction.save()

    // Return success response with order details
    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        paypalOrderId: paypalResponse.orderId,
        status: paypalResponse.status,
        amount,
        currency,
        feeCalculation,
        approvalUrl: paypalResponse.links?.find(link => link.rel === 'approve')?.href,
        links: paypalResponse.links
      }
    })

  } catch (error) {
    console.error('PayPal Create Order Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/paypal/create-order
 * Returns PayPal configuration status (for debugging)
 */
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Return PayPal configuration status (without sensitive data)
    return NextResponse.json({
      success: true,
      config: {
        isConfigured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
        currency: 'USD', // Default currency
        features: {
          createOrder: true,
          captureOrder: true,
          refund: true,
          webhooks: true
        }
      }
    })

  } catch (error) {
    console.error('PayPal Config Check Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}