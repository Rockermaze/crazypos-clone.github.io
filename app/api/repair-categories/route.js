import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RepairCategory from '@/models/RepairCategory'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const categories = await RepairCategory.find({ isActive: true }).sort({ name: 1 })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching repair categories:', error)
    return NextResponse.json({ error: 'Failed to fetch repair categories' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, estimatedCost, estimatedTime } = body

    if (!name || !estimatedTime) {
      return NextResponse.json({ 
        error: 'Name and estimated time are required' 
      }, { status: 400 })
    }

    await connectDB()

    // Check if category with this name already exists
    const existingCategory = await RepairCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      isActive: true 
    })
    
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists' 
      }, { status: 409 })
    }

    const category = new RepairCategory({
      name,
      description,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
      estimatedTime: parseInt(estimatedTime)
    })

    await category.save()
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating repair category:', error)
    return NextResponse.json({ error: 'Failed to create repair category' }, { status: 500 })
  }
}
