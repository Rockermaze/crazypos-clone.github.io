import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

/**
 * GET /api/paypal/success
 * Handles successful PayPal payment return
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') // PayPal order ID
    const PayerID = searchParams.get('PayerID')

    // Build redirect URL with payment success information
    const redirectUrl = new URL('/dashboard/payments/success', process.env.NEXTAUTH_URL)
    
    if (token) {
      redirectUrl.searchParams.set('orderId', token)
    }
    
    if (PayerID) {
      redirectUrl.searchParams.set('payerId', PayerID)
    }

    // Add success flag
    redirectUrl.searchParams.set('status', 'success')
    
    // Redirect to the success page
    return NextResponse.redirect(redirectUrl.toString())

  } catch (error) {
    console.error('PayPal Success Callback Error:', error)
    
    // Redirect to error page
    const errorUrl = new URL('/dashboard/payments/error', process.env.NEXTAUTH_URL)
    errorUrl.searchParams.set('error', 'callback_error')
    errorUrl.searchParams.set('message', 'Failed to process payment callback')
    
    return NextResponse.redirect(errorUrl.toString())
  }
}

/**
 * POST /api/paypal/success
 * Handle programmatic success callbacks
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, payerId, transactionId } = body

    // Return success response for AJAX calls
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        payerId,
        transactionId,
        message: 'Payment completed successfully',
        redirectUrl: '/dashboard/payments/success'
      }
    })

  } catch (error) {
    console.error('PayPal Success POST Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process success callback' 
      },
      { status: 500 }
    )
  }
}