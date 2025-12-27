import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Customer from '@/models/Customer'

// GET /api/customers - List all customers or search
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const contact = searchParams.get('contact')
    const withDues = searchParams.get('withDues') === 'true'
    const top = searchParams.get('top')
    const limit = parseInt(searchParams.get('limit') || '50')

    let customers

    // Search by contact (phone or email)
    if (contact) {
      const customer = await Customer.findByContact(session.user.id, contact)
      return NextResponse.json({
        success: true,
        customer: customer ? customer.toAPIResponse() : null
      })
    }

    // Search by query string
    if (query) {
      customers = await Customer.searchCustomers(session.user.id, query, limit)
    }
    // Get customers with dues
    else if (withDues) {
      customers = await Customer.getCustomersWithDues(session.user.id, limit)
    }
    // Get top customers by purchase value
    else if (top) {
      const topLimit = parseInt(top) || 10
      customers = await Customer.getTopCustomers(session.user.id, topLimit)
    }
    // Get all customers
    else {
      customers = await Customer.find({ 
        userId: session.user.id,
        isActive: true 
      })
      .sort({ lastPurchaseDate: -1, createdAt: -1 })
      .limit(limit)
    }

    const customerList = customers.map(c => c.toAPIResponse())

    return NextResponse.json({
      success: true,
      customers: customerList,
      count: customerList.length
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { name, email, phone, address, notes, tags, dueAmount } = body

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({
      userId: session.user.id,
      phone: phone.trim()
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create new customer
    const customer = new Customer({
      userId: session.user.id,
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone.trim(),
      address: address || {},
      notes: notes?.trim() || undefined,
      tags: tags || [],
      dueAmount: dueAmount || 0
    })

    await customer.save()

    return NextResponse.json({
      success: true,
      customer: customer.toAPIResponse(),
      message: 'Customer created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating customer:', error)
    
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
        error: 'Failed to create customer',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
