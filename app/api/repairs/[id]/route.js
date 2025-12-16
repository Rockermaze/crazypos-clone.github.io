import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RepairTicket from '@/models/RepairTicket'

// GET /api/repairs/[id] - Get single repair ticket
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 })
    }

    await connectDB()
    
    const repair = await RepairTicket.findOne({
      _id: id,
      userId: session.user.id
    }).lean()

    if (!repair) {
      return NextResponse.json({ error: 'Repair ticket not found' }, { status: 404 })
    }

    // Convert to response format
    const responseRepair = {
      ...repair,
      id: repair._id.toString(),
      _id: undefined,
      userId: undefined,
      technicianId: repair.technicianId ? repair.technicianId.toString() : undefined,
      categoryId: repair.categoryId ? repair.categoryId.toString() : undefined
    }

    return NextResponse.json({ repair: responseRepair })
  } catch (error) {
    console.error('Error fetching repair:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/repairs/[id] - Update repair ticket status or other fields
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 })
    }

    const body = await request.json()
    console.log('📝 Updating repair ticket:', id, 'with data:', JSON.stringify(body, null, 2))

    await connectDB()
    
    // Find the repair ticket
    const existingRepair = await RepairTicket.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!existingRepair) {
      return NextResponse.json({ error: 'Repair ticket not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData = { ...body, updatedAt: new Date() }
    
    // Handle status change logic
    if (body.status) {
      // Validate status
      const validStatuses = ['pending', 'in-progress', 'waiting-parts', 'completed', 'picked-up', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
      
      updateData.status = body.status

      // Set actual completion date when marking as completed
      if (body.status === 'completed' && existingRepair.status !== 'completed') {
        updateData.actualCompletionDate = new Date()
      }
      
      // Clear actual completion date if moving away from completed status
      if (body.status !== 'completed' && existingRepair.status === 'completed') {
        updateData.actualCompletionDate = null
      }
    }

    // Handle other field updates
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 })
      }
      updateData.priority = body.priority
    }

    if (body.actualCost !== undefined) {
      updateData.actualCost = parseFloat(body.actualCost)
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes.trim()
    }

    if (body.partsUsed) {
      updateData.partsUsed = body.partsUsed
    }

    // Update the repair ticket
    const updatedRepair = await RepairTicket.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean()

    // Convert to response format
    const responseRepair = {
      ...updatedRepair,
      id: updatedRepair._id.toString(),
      _id: undefined,
      userId: undefined,
      technicianId: updatedRepair.technicianId ? updatedRepair.technicianId.toString() : undefined,
      categoryId: updatedRepair.categoryId ? updatedRepair.categoryId.toString() : undefined
    }

    return NextResponse.json({
      message: 'Repair ticket updated successfully',
      repair: responseRepair
    })
  } catch (error) {
    console.error('Error updating repair:', error)
    
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

// DELETE /api/repairs/[id] - Delete repair ticket
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 })
    }

    await connectDB()
    
    const result = await RepairTicket.findOneAndDelete({
      _id: id,
      userId: session.user.id
    })

    if (!result) {
      return NextResponse.json({ error: 'Repair ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Repair ticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting repair:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}