import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RepairTicket from '@/models/RepairTicket'
import Counter from '@/models/Counter'
import StoreSettings from '@/models/StoreSettings'
import { generateRepairInvoicePDF } from '@/lib/pdf/generateRepairInvoice'
import { sendRepairTicketEmail } from '@/lib/email'

// GET /api/repairs - Get all repair tickets for authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = { userId: session.user.id }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority
    }

    const repairs = await RepairTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Convert MongoDB ObjectIds to strings
    const serializedRepairs = repairs.map(repair => ({
      ...repair,
      id: repair._id.toString(),
      _id: undefined,
      userId: undefined,
      technicianId: repair.technicianId ? repair.technicianId.toString() : undefined,
      categoryId: repair.categoryId ? repair.categoryId.toString() : undefined
    }))

    return NextResponse.json({ repairs: serializedRepairs })
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/repairs - Create new repair ticket
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 Creating repair ticket with data:', JSON.stringify(body, null, 2))
    const {
      customerInfo,
      deviceInfo,
      status = 'pending',
      priority = 'medium',
      categoryId,
      categoryName,
      estimatedCost,
      laborCost = 0,
      notes = '',
      estimatedCompletion,
      estimatedCompletionDate
    } = body

    // Validate required fields
    if (!customerInfo || !deviceInfo || estimatedCost === undefined || estimatedCost === null) {
      return NextResponse.json(
        { error: 'Customer info, device info, and estimated cost are required' },
        { status: 400 }
      )
    }

    if (!customerInfo.name || !customerInfo.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    if (!deviceInfo.brand || !deviceInfo.model || !deviceInfo.issueDescription) {
      return NextResponse.json(
        { error: 'Device brand, model, and issue description are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Generate ticket number using Counter.getNextSequence
    const ticketCounter = await Counter.getNextSequence('ticket', session.user.id)
    const ticketNumber = `TKT-${ticketCounter.toString().padStart(5, '0')}`

    // Create new repair ticket
    const newRepair = new RepairTicket({
      ticketNumber,
      customerInfo: {
        name: customerInfo.name.trim(),
        email: customerInfo.email?.trim(),
        phone: customerInfo.phone.trim()
      },
      deviceInfo: {
        brand: deviceInfo.brand.trim(),
        model: deviceInfo.model.trim(),
        serialNumber: deviceInfo.serialNumber?.trim(),
        imei: deviceInfo.imei?.trim(),
        condition: deviceInfo.condition?.trim() || 'Unknown',
        issueDescription: deviceInfo.issueDescription.trim()
      },
      status,
      priority,
      categoryId: categoryId || undefined,
      categoryName: categoryName?.trim() || undefined,
      estimatedCost: parseFloat(estimatedCost),
      laborCost: parseFloat(laborCost),
      notes: notes.trim(),
      userId: session.user.id,
      dateReceived: new Date(),
      estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : estimatedCompletionDate ? new Date(estimatedCompletionDate) : undefined
    })

    const savedRepair = await newRepair.save()

    // Send ticket email if customer email is provided
    if (customerInfo?.email) {
      try {
        // Fetch store settings
        const storeSettings = await StoreSettings.findOne({ userId: session.user.id })
        
        if (storeSettings) {
          // Generate PDF
          const pdfBuffer = generateRepairInvoicePDF({
            ticket: savedRepair,
            storeSettings
          })
          
          // Send email
          const emailResult = await sendRepairTicketEmail({
            to: customerInfo.email,
            customerName: customerInfo.name,
            ticketNumber: savedRepair.ticketNumber,
            pdfBuffer,
            storeName: storeSettings.storeName,
            storeEmail: storeSettings.storeEmail
          })
          
          if (emailResult.success) {
            console.log(`Repair ticket email sent successfully to ${customerInfo.email}`)
          } else {
            console.error(`Failed to send repair ticket email: ${emailResult.error}`)
          }
        }
      } catch (emailErr) {
        console.error('Warning: Failed to send repair ticket email:', emailErr)
        // Don't fail the ticket creation if email sending fails
      }
    }

    // Convert to response format
    const responseRepair = {
      id: savedRepair._id.toString(),
      ticketNumber: savedRepair.ticketNumber,
      customerInfo: savedRepair.customerInfo,
      deviceInfo: savedRepair.deviceInfo,
      status: savedRepair.status,
      priority: savedRepair.priority,
      categoryId: savedRepair.categoryId?.toString(),
      categoryName: savedRepair.categoryName,
      estimatedCost: savedRepair.estimatedCost,
      actualCost: savedRepair.actualCost,
      partsUsed: savedRepair.partsUsed,
      laborCost: savedRepair.laborCost,
      notes: savedRepair.notes,
      dateReceived: savedRepair.dateReceived,
      estimatedCompletion: savedRepair.estimatedCompletion,
      actualCompletion: savedRepair.actualCompletion,
      createdAt: savedRepair.createdAt,
      updatedAt: savedRepair.updatedAt
    }

    return NextResponse.json(
      { 
        message: 'Repair ticket created successfully', 
        repair: responseRepair 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating repair ticket:', error)
    
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
