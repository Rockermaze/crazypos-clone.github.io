import { NextResponse } from 'next/server'
import gateway from '@/lib/braintree'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

export async function POST(request) {
  try {
    const raw = await request.text()
    const params = new URLSearchParams(raw)
    const btSignature = params.get('bt_signature')
    const btPayload = params.get('bt_payload')

    if (!btSignature || !btPayload) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 })
    }

    const notification = await gateway.webhookNotification.parse(btSignature, btPayload)

    await connectDB()

    // Minimal examples: update local Transaction by orderId if present
    const kind = notification.kind
    const btTxn = notification.transaction

    if (btTxn?.orderId) {
      const txnDoc = await Transaction.findOne({ transactionId: btTxn.orderId })
      if (txnDoc) {
        if (kind === 'transaction_settled') {
          txnDoc.status = 'COMPLETED'
          txnDoc.notes = `${txnDoc.notes}\nBraintree settled` 
        } else if (kind === 'transaction_settlement_declined') {
          txnDoc.status = 'FAILED'
          txnDoc.notes = `${txnDoc.notes}\nBraintree settlement declined`
        }
        txnDoc.metadata = {
          ...txnDoc.metadata,
          webhook: {
            kind,
            btId: btTxn.id,
            status: btTxn.status,
          }
        }
        await txnDoc.save()
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Braintree webhook parse error:', e)
    return NextResponse.json({ success: false }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Braintree webhook endpoint active' })
}