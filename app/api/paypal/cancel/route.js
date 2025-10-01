import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * GET /api/paypal/cancel
 * Handles cancelled PayPal payment return
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') // PayPal order ID

    // Try to update transaction status if possible
    if (token) {
      try {
        await connectDB()
        
        // Find and update the transaction
        const transaction = await Transaction.findOne({
          paypalOrderId: token
        })

        if (transaction && transaction.status === 'PENDING') {
          transaction.status = 'CANCELLED'
          transaction.notes = `${transaction.notes}\nPayment cancelled by user via PayPal`
          await transaction.save()
        }
      } catch (dbError) {
        console.error('Error updating cancelled transaction:', dbError)
        // Continue with redirect even if DB update fails
      }
    }

    // Build redirect URL with cancellation information
    const redirectUrl = new URL('/dashboard/payments/cancelled', process.env.NEXTAUTH_URL)
    
    if (token) {
      redirectUrl.searchParams.set('orderId', token)
    }

    // Add cancellation flag
    redirectUrl.searchParams.set('status', 'cancelled')
    redirectUrl.searchParams.set('message', 'Payment was cancelled')
    
    // Redirect to the cancellation page
    return NextResponse.redirect(redirectUrl.toString())

  } catch (error) {
    console.error('PayPal Cancel Callback Error:', error)
    
    // Redirect to error page
    const errorUrl = new URL('/dashboard/payments/error', process.env.NEXTAUTH_URL)
    errorUrl.searchParams.set('error', 'callback_error')
    errorUrl.searchParams.set('message', 'Failed to process payment cancellation')
    
    return NextResponse.redirect(errorUrl.toString())
  }
}

/**
 * POST /api/paypal/cancel
 * Handle programmatic cancellation
 */
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, transactionId, reason = 'User cancelled payment' } = body

    // Connect to database
    await connectDB()

    // Find the transaction
    let transaction = null
    if (transactionId) {
      transaction = await Transaction.findOne({
        transactionId,
        userId: session.user.id
      })
    } else if (orderId) {
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

    // Update transaction status
    if (transaction.status === 'PENDING') {
      transaction.status = 'CANCELLED'
      transaction.notes = `${transaction.notes}\nPayment cancelled: ${reason}`
      await transaction.save()
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        status: 'CANCELLED',
        message: 'Payment has been cancelled',
        transaction: transaction.toAPIResponse()
      }
    })

  } catch (error) {
    console.error('PayPal Cancel POST Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process cancellation' 
      },
      { status: 500 }
    )
  }
}