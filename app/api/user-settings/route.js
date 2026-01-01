import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import UserSettings from '@/models/UserSettings'

// GET /api/user-settings - Get all user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    // Get or create settings for user
    const settings = await UserSettings.getOrCreate(session.user.id)

    return NextResponse.json({ 
      success: true,
      settings: settings.getAllSettings()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

// POST /api/user-settings - Update user settings
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      companyInformation,
      storeInformation,
      emailSettings,
      printingSettings,
      paymentSettings
    } = body

    // Validate that at least one settings section is provided
    if (!companyInformation && !storeInformation && !emailSettings && !printingSettings && !paymentSettings) {
      return NextResponse.json(
        { error: 'At least one settings section must be provided' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get or create settings for user
    let settings = await UserSettings.getOrCreate(session.user.id)

    // Update only the provided sections
    const updateObj = {}
    
    if (companyInformation) {
      Object.keys(companyInformation).forEach(key => {
        updateObj[`companyInformation.${key}`] = companyInformation[key]
      })
    }
    
    if (storeInformation) {
      Object.keys(storeInformation).forEach(key => {
        updateObj[`storeInformation.${key}`] = storeInformation[key]
      })
    }
    
    if (emailSettings) {
      Object.keys(emailSettings).forEach(key => {
        updateObj[`emailSettings.${key}`] = emailSettings[key]
      })
    }
    
    if (printingSettings) {
      Object.keys(printingSettings).forEach(key => {
        updateObj[`printingSettings.${key}`] = printingSettings[key]
      })
    }
    
    if (paymentSettings) {
      Object.keys(paymentSettings).forEach(key => {
        updateObj[`paymentSettings.${key}`] = paymentSettings[key]
      })
    }

    // Update settings
    settings = await UserSettings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateObj },
      { new: true, runValidators: true }
    )

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully',
      settings: settings.getAllSettings()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}

// PUT /api/user-settings - Replace entire settings (less common, used for bulk updates)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    await connectDB()

    // Update or create settings
    const settings = await UserSettings.findOneAndUpdate(
      { userId: session.user.id },
      { 
        userId: session.user.id,
        ...body
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )

    return NextResponse.json({ 
      success: true,
      message: 'Settings replaced successfully',
      settings: settings.getAllSettings()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to replace user settings' },
      { status: 500 }
    )
  }
}

// DELETE /api/user-settings - Reset settings to defaults
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Delete existing settings (will be recreated with defaults on next GET)
    await UserSettings.findOneAndDelete({ userId: session.user.id })

    return NextResponse.json({ 
      success: true,
      message: 'Settings reset to defaults'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset user settings' },
      { status: 500 }
    )
  }
}
