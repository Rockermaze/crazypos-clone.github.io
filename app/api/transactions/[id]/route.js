import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * GET /api/transactions/[id]
 * Retrieves a specific transaction by ID
 */
export async function GET(request, { params }) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find transaction by ID or transactionId
    const transaction = await Transaction.findOne({
      $or: [
        { _id: id },
        { transactionId: id }
      ],
      userId: session.user.id
    }).populate('saleId')

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: transaction.toAPIResponse()
      }
    })

  } catch (error) {
    console.error('Get Transaction Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve transaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/transactions/[id]
 * Updates a transaction (limited fields)
 */
export async function PUT(request, { params }) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find transaction
    const transaction = await Transaction.findOne({
      $or: [
        { _id: id },
        { transactionId: id }
      ],
      userId: session.user.id
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Only allow updating specific fields
    const allowedUpdates = ['notes', 'customer', 'metadata']
    const updates = {}

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Update transaction
    Object.assign(transaction, updates)
    
    // Add update note
    if (updates.notes) {
      transaction.notes = `${transaction.notes}\nUpdated by ${session.user.email} at ${new Date().toISOString()}: ${updates.notes}`
    }

    await transaction.save()

    return NextResponse.json({
      success: true,
      data: {
        transaction: transaction.toAPIResponse()
      },
      message: 'Transaction updated successfully'
    })

  } catch (error) {
    console.error('Update Transaction Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update transaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]
 * Soft deletes a transaction (only for pending transactions)
 */
export async function DELETE(request, { params }) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find transaction
    const transaction = await Transaction.findOne({
      $or: [
        { _id: id },
        { transactionId: id }
      ],
      userId: session.user.id
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending or failed transactions
    if (!['PENDING', 'FAILED', 'CANCELLED'].includes(transaction.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete completed transactions. Use refund instead.' },
        { status: 400 }
      )
    }

    // Update status to cancelled instead of actual deletion
    transaction.status = 'CANCELLED'
    transaction.notes = `${transaction.notes}\nTransaction cancelled by ${session.user.email} at ${new Date().toISOString()}`
    
    await transaction.save()

    return NextResponse.json({
      success: true,
      message: 'Transaction cancelled successfully'
    })

  } catch (error) {
    console.error('Delete Transaction Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete transaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
