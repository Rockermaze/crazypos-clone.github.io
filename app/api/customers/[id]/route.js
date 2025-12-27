import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Customer from '@/models/Customer'
import Sale from '@/models/Sale'

// GET /api/customers/[id] - Get single customer with details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = await params
    
    const customer = await Customer.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Optionally get recent sales for this customer
    const recentSales = await Sale.find({
      userId: session.user.id,
      'customerInfo.phone': customer.phone
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('receiptNumber total paymentMethod paymentStatus createdAt items')

    return NextResponse.json({
      success: true,
      customer: customer.toAPIResponse(),
      recentSales: recentSales || []
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch customer',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = await params
    const body = await request.json()
    
    const customer = await Customer.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'email', 'phone', 'address', 
      'notes', 'tags', 'isActive', 'loyaltyPoints'
    ]

    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        customer[field] = body[field]
      }
    })

    // Handle special operations
    if (body.addDue) {
      await customer.addDue(body.addDue.amount, body.addDue.reason)
    }

    if (body.addPayment) {
      await customer.addPayment(
        body.addPayment.amount,
        body.addPayment.paymentMethod,
        body.addPayment.notes,
        session.user.id
      )
    }

    await customer.save()

    return NextResponse.json({
      success: true,
      customer: customer.toAPIResponse(),
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Error updating customer:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: messages 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update customer',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Soft delete (deactivate) customer
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = await params
    
    const customer = await Customer.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Soft delete - just deactivate
    customer.isActive = false
    await customer.save()

    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete customer',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
