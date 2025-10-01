import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import Counter from '@/models/Counter'
import Transaction from '@/models/Transaction'

// GET /api/sales - Get all sales for authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = { userId: session.user.id }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Convert MongoDB ObjectIds to strings
    const serializedSales = sales.map(sale => ({
      ...sale,
      id: sale._id.toString(),
      _id: undefined,
      userId: undefined,
      cashierId: undefined
    }))

    return NextResponse.json({ sales: serializedSales })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Create new sale
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      items,
      subtotal,
      tax,
      discount = 0,
      total,
      paymentMethod,
      customerInfo
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale must have at least one item' },
        { status: 400 }
      )
    }

    if (!paymentMethod || !total || !subtotal) {
      return NextResponse.json(
        { error: 'Payment method, total, and subtotal are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get or create counter for receipt number
    let counter = await Counter.findOne({ userId: session.user.id })
    if (!counter) {
      counter = new Counter({ 
        userId: session.user.id,
        receiptNumber: 1000,
        ticketNumber: 1000,
        productId: 1000
      })
      await counter.save()
    }

    // Generate receipt number
    counter.receiptNumber += 1
    await counter.save()
    const receiptNumber = `R${counter.receiptNumber}`

    // Validate and update product stock
    for (const item of items) {
      const product = await Product.findOne({ 
        _id: item.productId, 
        userId: session.user.id 
      })
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productName} not found` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}` },
          { status: 400 }
        )
      }

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    // Create new sale
    const newSale = new Sale({
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0
      })),
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax || 0),
      discount: parseFloat(discount),
      total: parseFloat(total),
      paymentMethod,
      customerInfo,
      receiptNumber,
      cashierId: session.user.id,
      userId: session.user.id
    })

    const savedSale = await newSale.save()

    // For manual payments (e.g., CASH), create a corresponding Transaction record
    try {
      const manualMethods = new Set(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK'])
      const method = String(savedSale.paymentMethod || '').toUpperCase()

      if (manualMethods.has(method)) {
        const txnId = Transaction.generateTransactionId()
        const description = `Sale ${savedSale.receiptNumber} - ${method} payment`

        const transaction = new Transaction({
          transactionId: txnId,
          userId: session.user.id,
          saleId: savedSale._id,
          amount: savedSale.total,
          currency: savedSale.currency || 'USD',
          type: 'PAYMENT',
          status: 'COMPLETED',
          paymentMethod: method,
          paymentGateway: 'MANUAL',
          description,
          notes: `Manual ${method} payment recorded for receipt ${savedSale.receiptNumber}`,
          fee: { amount: 0, currency: savedSale.currency || 'USD', type: 'TRANSACTION_FEE' },
          netAmount: savedSale.total,
          customer: savedSale.customerInfo ? {
            name: savedSale.customerInfo.name,
            email: savedSale.customerInfo.email,
            phone: savedSale.customerInfo.phone
          } : {},
          metadata: {
            source: 'sales-api',
            receiptNumber: savedSale.receiptNumber
          },
          processedAt: new Date(),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent')
        })

        const savedTxn = await transaction.save()

        // Update sale with gateway and transaction reference
        savedSale.paymentGateway = 'MANUAL'
        savedSale.transactionId = savedTxn._id
        if (savedSale.paymentStatus !== 'COMPLETED') {
          savedSale.paymentStatus = 'COMPLETED'
        }
        await savedSale.save()
      }
    } catch (txnErr) {
      console.error('Warning: Failed to create manual transaction for sale:', txnErr)
      // Do not fail the sale creation if transaction creation fails
    }

    // Convert to response format
    const responseSale = {
      id: savedSale._id.toString(),
      items: savedSale.items,
      subtotal: savedSale.subtotal,
      tax: savedSale.tax,
      discount: savedSale.discount,
      total: savedSale.total,
      paymentMethod: savedSale.paymentMethod,
      paymentStatus: savedSale.paymentStatus,
      customerInfo: savedSale.customerInfo,
      receiptNumber: savedSale.receiptNumber,
      createdAt: savedSale.createdAt,
      updatedAt: savedSale.updatedAt
    }

    return NextResponse.json(
      { 
        message: 'Sale recorded successfully', 
        sale: responseSale 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sale:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
