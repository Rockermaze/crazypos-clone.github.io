import { NextResponse } from 'next/server'
import gateway from '@/lib/braintree'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

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
    const { amount, paymentMethodNonce, deviceData, orderId, customer } = body

    if (!amount || !paymentMethodNonce) {
      return NextResponse.json({ success: false, error: 'amount and paymentMethodNonce are required' }, { status: 400 })
    }

    await connectDB()

    const transactionId = Transaction.generateTransactionId()

    // Create a local transaction record (PENDING)
    const txnDoc = new Transaction({
      transactionId,
      userId: session.user.id,
      amount,
      currency: 'USD',
      type: 'PAYMENT',
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      paymentGateway: 'BRAINTREE',
      description: 'Braintree checkout',
      notes: 'Braintree sale initiated',
      metadata: {
        deviceData,
        orderId: orderId || null,
        agent: request.headers.get('user-agent')
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      customer: customer ? {
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || undefined,
        email: customer.email,
        phone: customer.phone,
      } : undefined,
    })

    await txnDoc.save()

    const saleResult = await gateway.transaction.sale({
      amount: Number(amount).toFixed(2),
      paymentMethodNonce,
      orderId: orderId || transactionId,
      deviceData,
      options: {
        submitForSettlement: true,
      },
    })

    if (!saleResult.success) {
      txnDoc.status = 'FAILED'
      txnDoc.notes = `${txnDoc.notes}\nSale failed: ${saleResult.message || 'Unknown error'}`
      await txnDoc.save()

      return NextResponse.json({
        success: false,
        error: saleResult.message || 'Braintree sale failed',
        details: saleResult,
      }, { status: 400 })
    }

    const txn = saleResult.transaction

    // Update local transaction record to COMPLETED and store BT IDs
    txnDoc.status = 'COMPLETED'
    txnDoc.processedAt = new Date()
    txnDoc.notes = `${txnDoc.notes}\nBraintree sale successful - ID: ${txn.id}`
    txnDoc.metadata = {
      ...txnDoc.metadata,
      braintree: {
        id: txn.id,
        status: txn.status,
        type: txn.type,
        paymentInstrumentType: txn.paymentInstrumentType,
      }
    }

    // Map gateway method to app payment method for reporting
    if (txn.paymentInstrumentType?.includes('paypal')) {
      txnDoc.paymentMethod = 'PAYPAL'
    } else if (txn.paymentInstrumentType?.includes('android_pay') || txn.paymentInstrumentType?.includes('google_pay')) {
      txnDoc.paymentMethod = 'CREDIT_CARD'
    } else {
      txnDoc.paymentMethod = 'CREDIT_CARD'
    }

    await txnDoc.save()

    return NextResponse.json({
      success: true,
      data: {
        transactionId: txnDoc.transactionId,
        braintreeTransactionId: txn.id,
        status: txn.status,
        type: txn.type,
        amount: txn.amount,
        currencyIsoCode: txn.currencyIsoCode,
        paymentInstrumentType: txn.paymentInstrumentType,
      },
    })
  } catch (e) {
    console.error('Braintree checkout error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}