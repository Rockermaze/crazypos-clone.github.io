import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { capturePayPalOrder, getPayPalOrderDetails } from '@/lib/paypal'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * POST /api/paypal/capture-order
 * Captures a PayPal order payment after user approval
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
    const { orderId, transactionId } = body

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'PayPal order ID is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find the transaction record
    let transaction = null
    if (transactionId) {
      transaction = await Transaction.findOne({
        transactionId,
        userId: session.user.id,
        paypalOrderId: orderId
      })
    } else {
      // Fallback: search by PayPal order ID
      transaction = await Transaction.findOne({
        paypalOrderId: orderId,
        userId: session.user.id
      })
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if transaction is already processed
    if (transaction.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          status: 'ALREADY_CAPTURED',
          message: 'Payment has already been captured',
          transaction: transaction.toAPIResponse()
        }
      })
    }

    // Update transaction status to processing
    transaction.status = 'PROCESSING'
    transaction.notes = `${transaction.notes}\nCapture initiated at ${new Date().toISOString()}`
    await transaction.save()

    try {
      // Get order details first (optional but good for logging)
      const orderDetails = await getPayPalOrderDetails(orderId)
      
      // Capture the PayPal order
      const captureResponse = await capturePayPalOrder(orderId)

      if (!captureResponse.success) {
        // Update transaction status to failed
        transaction.status = 'FAILED'
        transaction.notes = `${transaction.notes}\nCapture failed: ${captureResponse.error}`
        await transaction.save()

        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to capture PayPal payment',
            details: captureResponse.error 
          },
          { status: 400 }
        )
      }

      // Update transaction with capture details
      transaction.status = 'COMPLETED'
      transaction.paypalCaptureId = captureResponse.captureId
      transaction.processedAt = new Date()
      transaction.notes = `${transaction.notes}\nPayment captured successfully - Capture ID: ${captureResponse.captureId}`
      
      // Update PayPal data with capture information
      if (transaction.paypalData) {
        transaction.paypalData = {
          ...transaction.paypalData,
          captureData: captureResponse.data
        }
      } else {
        transaction.paypalData = {
          captureData: captureResponse.data
        }
      }

      // Add capture metadata
      transaction.metadata = {
        ...transaction.metadata,
        capturedAt: new Date().toISOString(),
        captureId: captureResponse.captureId,
        captureStatus: captureResponse.status
      }

      await transaction.save()

      // Return success response
      return NextResponse.json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          captureId: captureResponse.captureId,
          status: 'CAPTURED',
          amount: transaction.amount,
          currency: transaction.currency,
          netAmount: transaction.netAmount,
          processedAt: transaction.processedAt,
          transaction: transaction.toAPIResponse()
        }
      })

    } catch (captureError) {
      // Update transaction status to failed
      transaction.status = 'FAILED'
      transaction.notes = `${transaction.notes}\nCapture error: ${captureError.message}`
      await transaction.save()

      throw captureError
    }

  } catch (error) {
    console.error('PayPal Capture Order Error:', error)
    
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
 * GET /api/paypal/capture-order?orderId=xxx
 * Gets the status of a PayPal order before capturing
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

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'PayPal order ID is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find transaction
    const transaction = await Transaction.findOne({
      paypalOrderId: orderId,
      userId: session.user.id
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Get PayPal order details
    const orderDetails = await getPayPalOrderDetails(orderId)

    if (!orderDetails.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get PayPal order details',
          details: orderDetails.error 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: transaction.toAPIResponse(),
        paypalOrder: orderDetails.data,
        canCapture: orderDetails.data.status === 'APPROVED' && transaction.status === 'PENDING'
      }
    })

  } catch (error) {
    console.error('PayPal Get Order Status Error:', error)
    
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