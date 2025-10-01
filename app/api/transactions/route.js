import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * GET /api/transactions
 * Retrieves transactions with filtering, pagination, and search
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const paymentMethod = searchParams.get('paymentMethod')
    const paymentGateway = searchParams.get('paymentGateway')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const saleId = searchParams.get('saleId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // Connect to database
    await connectDB()

    // Build query
    const query = { userId: session.user.id }

    // Add filters
    if (status) query.status = status.toUpperCase()
    if (type) query.type = type.toUpperCase()
    if (paymentMethod) query.paymentMethod = paymentMethod.toUpperCase()
    if (paymentGateway) query.paymentGateway = paymentGateway.toUpperCase()
    if (saleId) query.saleId = saleId

    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Add text search
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute queries
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Format transactions for API response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      netAmount: transaction.netAmount,
      currency: transaction.currency,
      formattedAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: transaction.currency || 'USD'
      }).format(transaction.amount),
      formattedNetAmount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: transaction.currency || 'USD'
      }).format(transaction.netAmount),
      type: transaction.type,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      paymentGateway: transaction.paymentGateway,
      description: transaction.description,
      customer: transaction.customer,
      fee: transaction.fee,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      paypalOrderId: transaction.paypalOrderId,
      paypalCaptureId: transaction.paypalCaptureId,
      saleId: transaction.saleId
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          type,
          paymentMethod,
          paymentGateway,
          startDate,
          endDate,
          search,
          saleId
        }
      }
    })

  } catch (error) {
    console.error('Get Transactions Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve transactions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Creates a new manual transaction
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      amount,
      currency = 'USD',
      type,
      paymentMethod,
      description,
      customer = {},
      notes = '',
      saleId,
      metadata = {}
    } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Transaction type is required' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Generate transaction ID
    const transactionId = Transaction.generateTransactionId()

    // Create transaction
    const transaction = new Transaction({
      transactionId,
      userId: session.user.id,
      saleId: saleId || null,
      amount,
      currency: currency.toUpperCase(),
      type: type.toUpperCase(),
      status: 'COMPLETED', // Manual transactions are immediately completed
      paymentMethod: paymentMethod.toUpperCase(),
      paymentGateway: 'MANUAL',
      description,
      notes: notes || `Manual transaction created by ${session.user.email}`,
      netAmount: amount, // No fees for manual transactions
      customer: {
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || ''
      },
      metadata: {
        ...metadata,
        createdVia: 'manual-api',
        createdBy: session.user.email,
        userAgent: request.headers.get('user-agent')
      },
      processedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    })

    await transaction.save()

    return NextResponse.json({
      success: true,
      data: {
        transaction: transaction.toAPIResponse()
      },
      message: 'Transaction created successfully'
    })

  } catch (error) {
    console.error('Create Transaction Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}