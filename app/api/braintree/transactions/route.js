import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * GET /api/braintree/transactions
 * Lists recent transactions processed via Braintree
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    await connectDB()

    const query = { userId: session.user.id, paymentGateway: 'BRAINTREE' }

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t._id,
          transactionId: t.transactionId,
          amount: t.amount,
          netAmount: t.netAmount,
          currency: t.currency,
          status: t.status,
          paymentMethod: t.paymentMethod,
          paymentGateway: t.paymentGateway,
          description: t.description,
          createdAt: t.createdAt,
          formattedAmount: new Intl.NumberFormat('en-US', { style: 'currency', currency: t.currency || 'USD' }).format(t.amount),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })
  } catch (e) {
    console.error('List Braintree transactions error:', e)
    return NextResponse.json({ success: false, error: 'Failed to list Braintree transactions' }, { status: 500 })
  }
}