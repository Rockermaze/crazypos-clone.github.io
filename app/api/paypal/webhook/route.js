import { NextResponse } from 'next/server'
import { verifyPayPalWebhook } from '@/lib/paypal'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * POST /api/paypal/webhook
 * Handles PayPal webhook events
 */
export async function POST(request) {
  try {
    // Get the raw body for webhook verification
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    // Verify webhook signature (basic verification)
    const isValidWebhook = verifyPayPalWebhook(headers, body)
    
    if (!isValidWebhook) {
      console.error('Invalid PayPal webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const webhookEvent = JSON.parse(body)
    const { event_type, resource } = webhookEvent

    console.log(`PayPal Webhook: ${event_type}`, {
      eventId: webhookEvent.id,
      resourceType: resource?.id ? 'with_resource' : 'no_resource',
      timestamp: webhookEvent.create_time
    })

    // Connect to database
    await connectDB()

    // Handle different webhook events
    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(webhookEvent, resource)
        break
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(webhookEvent, resource)
        break
        
      case 'PAYMENT.CAPTURE.PENDING':
        await handlePaymentCapturePending(webhookEvent, resource)
        break
        
      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(webhookEvent, resource)
        break
        
      case 'CHECKOUT.ORDER.COMPLETED':
        await handleCheckoutOrderCompleted(webhookEvent, resource)
        break
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(webhookEvent, resource)
        break
        
      default:
        console.log(`Unhandled PayPal webhook event: ${event_type}`)
        // Log unhandled events for debugging
        await logWebhookEvent(webhookEvent)
    }

    // Always return success to PayPal
    return NextResponse.json({ success: true, received: true })

  } catch (error) {
    console.error('PayPal Webhook Error:', error)
    
    // Return success to prevent PayPal from retrying
    // Log the error for investigation
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed',
      received: true 
    })
  }
}

/**
 * Handle payment capture completed event
 */
async function handlePaymentCaptureCompleted(webhookEvent, resource) {
  try {
    // Find transaction by capture ID or custom_id
    const transaction = await findTransactionByResource(resource)
    
    if (!transaction) {
      console.log('Transaction not found for capture completed event:', resource.id)
      return
    }

    // Update transaction status if not already completed
    if (transaction.status !== 'COMPLETED') {
      transaction.status = 'COMPLETED'
      transaction.paypalCaptureId = resource.id
      transaction.processedAt = new Date(resource.create_time)
      transaction.notes = `${transaction.notes}\nPayment capture completed via webhook`
      
      // Update PayPal data
      transaction.paypalData = {
        ...transaction.paypalData,
        webhookCaptureData: resource,
        webhookEvent: {
          id: webhookEvent.id,
          type: webhookEvent.event_type,
          timestamp: webhookEvent.create_time
        }
      }

      await transaction.save()
      console.log(`Transaction ${transaction.transactionId} marked as completed`)
    }
  } catch (error) {
    console.error('Error handling payment capture completed:', error)
  }
}

/**
 * Handle payment capture denied event
 */
async function handlePaymentCaptureDenied(webhookEvent, resource) {
  try {
    const transaction = await findTransactionByResource(resource)
    
    if (!transaction) {
      console.log('Transaction not found for capture denied event:', resource.id)
      return
    }

    // Update transaction status
    transaction.status = 'FAILED'
    transaction.notes = `${transaction.notes}\nPayment capture denied via webhook - Reason: ${resource.status_details?.reason || 'Unknown'}`
    
    // Add webhook data
    transaction.paypalData = {
      ...transaction.paypalData,
      webhookDeniedData: resource,
      webhookEvent: {
        id: webhookEvent.id,
        type: webhookEvent.event_type,
        timestamp: webhookEvent.create_time
      }
    }

    await transaction.save()
    console.log(`Transaction ${transaction.transactionId} marked as failed (denied)`)
  } catch (error) {
    console.error('Error handling payment capture denied:', error)
  }
}

/**
 * Handle payment capture pending event
 */
async function handlePaymentCapturePending(webhookEvent, resource) {
  try {
    const transaction = await findTransactionByResource(resource)
    
    if (!transaction) {
      console.log('Transaction not found for capture pending event:', resource.id)
      return
    }

    // Update transaction status
    transaction.status = 'PROCESSING'
    transaction.notes = `${transaction.notes}\nPayment capture pending via webhook - Reason: ${resource.status_details?.reason || 'Unknown'}`
    
    await transaction.save()
    console.log(`Transaction ${transaction.transactionId} marked as processing (pending)`)
  } catch (error) {
    console.error('Error handling payment capture pending:', error)
  }
}

/**
 * Handle checkout order approved event
 */
async function handleCheckoutOrderApproved(webhookEvent, resource) {
  try {
    // Find transaction by PayPal order ID
    const transaction = await Transaction.findOne({
      paypalOrderId: resource.id
    })
    
    if (!transaction) {
      console.log('Transaction not found for order approved event:', resource.id)
      return
    }

    // Update transaction notes
    transaction.notes = `${transaction.notes}\nOrder approved via webhook`
    
    // Add webhook data
    transaction.paypalData = {
      ...transaction.paypalData,
      webhookApprovedData: resource,
      webhookEvent: {
        id: webhookEvent.id,
        type: webhookEvent.event_type,
        timestamp: webhookEvent.create_time
      }
    }

    await transaction.save()
    console.log(`Transaction ${transaction.transactionId} order approved`)
  } catch (error) {
    console.error('Error handling checkout order approved:', error)
  }
}

/**
 * Handle checkout order completed event
 */
async function handleCheckoutOrderCompleted(webhookEvent, resource) {
  try {
    const transaction = await Transaction.findOne({
      paypalOrderId: resource.id
    })
    
    if (!transaction) {
      console.log('Transaction not found for order completed event:', resource.id)
      return
    }

    // This event usually comes after capture completed
    transaction.notes = `${transaction.notes}\nOrder completed via webhook`
    
    await transaction.save()
    console.log(`Transaction ${transaction.transactionId} order completed`)
  } catch (error) {
    console.error('Error handling checkout order completed:', error)
  }
}

/**
 * Handle payment capture refunded event
 */
async function handlePaymentCaptureRefunded(webhookEvent, resource) {
  try {
    // Find the original transaction
    const originalTransaction = await Transaction.findOne({
      paypalCaptureId: resource.id
    })

    if (!originalTransaction) {
      console.log('Original transaction not found for refund event:', resource.id)
      return
    }

    // Create a new refund transaction
    const refundTransaction = new Transaction({
      transactionId: Transaction.generateTransactionId(),
      paypalCaptureId: resource.id,
      paypalPaymentId: resource.supplementary_data?.related_ids?.order_id,
      userId: originalTransaction.userId,
      saleId: originalTransaction.saleId,
      amount: parseFloat(resource.amount.value),
      currency: resource.amount.currency_code,
      type: 'REFUND',
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL',
      paymentGateway: 'PAYPAL',
      description: `Refund for transaction ${originalTransaction.transactionId}`,
      notes: `Refund processed via webhook - Original transaction: ${originalTransaction.transactionId}`,
      netAmount: parseFloat(resource.amount.value),
      customer: originalTransaction.customer,
      refund: {
        amount: parseFloat(resource.amount.value),
        reason: 'Refund processed via PayPal webhook',
        refundedAt: new Date(resource.create_time),
        refundId: resource.id
      },
      paypalData: {
        webhookRefundData: resource,
        webhookEvent: {
          id: webhookEvent.id,
          type: webhookEvent.event_type,
          timestamp: webhookEvent.create_time
        }
      },
      processedAt: new Date(resource.create_time)
    })

    await refundTransaction.save()

    // Update original transaction status
    const refundAmount = parseFloat(resource.amount.value)
    if (refundAmount >= originalTransaction.amount) {
      originalTransaction.status = 'REFUNDED'
    } else {
      originalTransaction.status = 'PARTIALLY_REFUNDED'
    }
    
    originalTransaction.notes = `${originalTransaction.notes}\nRefund of ${resource.amount.currency_code} ${refundAmount} processed via webhook`
    await originalTransaction.save()

    console.log(`Refund transaction created for ${originalTransaction.transactionId}`)
  } catch (error) {
    console.error('Error handling payment capture refunded:', error)
  }
}

/**
 * Find transaction by PayPal resource
 */
async function findTransactionByResource(resource) {
  // Try to find by capture ID first
  if (resource.id) {
    let transaction = await Transaction.findOne({
      paypalCaptureId: resource.id
    })
    
    if (transaction) return transaction
  }

  // Try to find by custom_id (which should be our transaction ID)
  if (resource.custom_id) {
    let transaction = await Transaction.findOne({
      transactionId: resource.custom_id
    })
    
    if (transaction) return transaction
  }

  // Try to find by supplementary data
  if (resource.supplementary_data?.related_ids?.order_id) {
    let transaction = await Transaction.findOne({
      paypalOrderId: resource.supplementary_data.related_ids.order_id
    })
    
    if (transaction) return transaction
  }

  return null
}

/**
 * Log unhandled webhook events for debugging
 */
async function logWebhookEvent(webhookEvent) {
  try {
    // In a production system, you might want to store these in a separate collection
    console.log('Unhandled PayPal webhook event:', {
      id: webhookEvent.id,
      event_type: webhookEvent.event_type,
      create_time: webhookEvent.create_time,
      resource_type: webhookEvent.resource_type,
      summary: webhookEvent.summary
    })
  } catch (error) {
    console.error('Error logging webhook event:', error)
  }
}

// Handle GET requests (for webhook verification during setup)
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: 'PayPal webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}