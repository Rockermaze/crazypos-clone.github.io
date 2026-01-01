import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// GET /api/onboarding - Get user's onboarding status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findById(session.user.id).select('onboardingStatus').lean()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      onboardingStatus: user.onboardingStatus || {
        companyInformation: false,
        storeInformation: false,
        supplierConnection: false,
        emailSettings: false,
        paymentSettings: false,
        printingSettings: false,
        addProduct: false,
        completed: false,
        skipped: false
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}

// POST /api/onboarding - Update onboarding status
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { task, completed } = body

    if (!task || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Task name and completion status are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Valid onboarding tasks
    const validTasks = [
      'companyInformation',
      'storeInformation', 
      'supplierConnection',
      'emailSettings',
      'paymentSettings',
      'printingSettings',
      'addProduct',
      'completed',
      'skipped'
    ]

    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: 'Invalid task name' },
        { status: 400 }
      )
    }

    // Update the specific task status
    const updateObj = {}
    updateObj[`onboardingStatus.${task}`] = completed

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).select('onboardingStatus')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Onboarding status updated successfully',
      onboardingStatus: user.onboardingStatus
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
}

// PUT /api/onboarding - Skip onboarding entirely
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          'onboardingStatus.skipped': true,
          'onboardingStatus.completed': true
        } 
      },
      { new: true, runValidators: true }
    ).select('onboardingStatus')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Onboarding skipped successfully',
      onboardingStatus: user.onboardingStatus
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to skip onboarding' },
      { status: 500 }
    )
  }
}