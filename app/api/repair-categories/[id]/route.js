import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RepairCategory from '@/models/RepairCategory'
import mongoose from 'mongoose'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, estimatedCost, estimatedTime, isActive } = body

    if (!name || !estimatedCost || !estimatedTime) {
      return NextResponse.json({ 
        error: 'Name, estimated cost, and estimated time are required' 
      }, { status: 400 })
    }

    await connectDB()

    // Check if another category with this name already exists (excluding current one)
    const existingCategory = await RepairCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      _id: { $ne: id },
      isActive: true 
    })
    
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists' 
      }, { status: 409 })
    }

    const updatedCategory = await RepairCategory.findByIdAndUpdate(
      id,
      {
        name,
        description,
        estimatedCost: parseFloat(estimatedCost),
        estimatedTime: parseInt(estimatedTime),
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    )

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating repair category:', error)
    return NextResponse.json({ error: 'Failed to update repair category' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
    }

    await connectDB()

    // Soft delete - set isActive to false instead of actually deleting
    const category = await RepairCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    )

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting repair category:', error)
    return NextResponse.json({ error: 'Failed to delete repair category' }, { status: 500 })
  }
}
