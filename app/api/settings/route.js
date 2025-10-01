import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import StoreSettings from '@/models/StoreSettings'

// GET /api/settings - Get store settings for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const settings = await StoreSettings.findOne({ userId: session.user.id }).lean()

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    // Convert to response format
    const responseSettings = {
      ...settings,
      id: settings._id.toString(),
      _id: undefined,
      userId: undefined
    }

    return NextResponse.json({ settings: responseSettings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Create or update store settings
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      taxRate,
      currency = 'USD',
      receiptFooter,
      lowStockThreshold = 10,
      autoBackup = true,
      printerSettings
    } = body

    // Validate required fields
    if (!storeName || !storeAddress || !storePhone || !storeEmail) {
      return NextResponse.json(
        { error: 'Store name, address, phone, and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(storeEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate tax rate
    if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if settings exist for this user
    const existingSettings = await StoreSettings.findOne({ userId: session.user.id })

    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await StoreSettings.findOneAndUpdate(
        { userId: session.user.id },
        {
          storeName: storeName.trim(),
          storeAddress: storeAddress.trim(),
          storePhone: storePhone.trim(),
          storeEmail: storeEmail.trim().toLowerCase(),
          taxRate: taxRate !== undefined ? parseFloat(taxRate) : existingSettings.taxRate,
          currency,
          receiptFooter: receiptFooter?.trim() || existingSettings.receiptFooter,
          lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : existingSettings.lowStockThreshold,
          autoBackup,
          printerSettings: printerSettings || existingSettings.printerSettings
        },
        { new: true, runValidators: true }
      )
    } else {
      // Create new settings
      settings = new StoreSettings({
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        storePhone: storePhone.trim(),
        storeEmail: storeEmail.trim().toLowerCase(),
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 8.25,
        currency,
        receiptFooter: receiptFooter?.trim() || 'Thank you for your business!',
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : 10,
        autoBackup,
        printerSettings: printerSettings || {
          receiptPrinter: 'Default Receipt Printer',
          labelPrinter: 'Default Label Printer'
        },
        userId: session.user.id
      })
      
      settings = await settings.save()
    }

    // Convert to response format
    const responseSettings = {
      id: settings._id.toString(),
      storeName: settings.storeName,
      storeAddress: settings.storeAddress,
      storePhone: settings.storePhone,
      storeEmail: settings.storeEmail,
      taxRate: settings.taxRate,
      currency: settings.currency,
      receiptFooter: settings.receiptFooter,
      lowStockThreshold: settings.lowStockThreshold,
      autoBackup: settings.autoBackup,
      printerSettings: settings.printerSettings,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    }

    return NextResponse.json(
      { 
        message: 'Settings saved successfully', 
        settings: responseSettings 
      },
      { status: existingSettings ? 200 : 201 }
    )
  } catch (error) {
    console.error('Error saving settings:', error)
    
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
