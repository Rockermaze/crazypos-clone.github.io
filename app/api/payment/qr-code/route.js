import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'

// POST /api/payment/qr-code - Generate QR code for payment
export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      shopkeeperId, 
      amount, 
      description, 
      currency = 'usd',
      expiresIn = 3600 // 1 hour default
    } = body

    // Validate required fields
    if (!shopkeeperId || !amount) {
      return NextResponse.json({ 
        error: 'Shopkeeper ID and amount are required' 
      }, { status: 400 })
    }

    if (amount < 0.50) {
      return NextResponse.json({ 
        error: 'Amount must be at least $0.50' 
      }, { status: 400 })
    }

    await connectDB()

    // Verify shopkeeper exists and is active
    const shopkeeper = await User.findById(shopkeeperId)
    if (!shopkeeper) {
      return NextResponse.json({ error: 'Shopkeeper not found' }, { status: 404 })
    }

    if (shopkeeper.stripeAccountStatus !== 'active') {
      return NextResponse.json({ 
        error: 'Shopkeeper payment account is not active' 
      }, { status: 400 })
    }

    // Generate unique payment session ID
    const sessionId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create payment URL with parameters
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const paymentUrl = new URL(`${baseUrl}/pay/${shopkeeperId}`)
    
    // Add query parameters
    paymentUrl.searchParams.set('amount', amount.toString())
    paymentUrl.searchParams.set('currency', currency)
    paymentUrl.searchParams.set('session', sessionId)
    if (description) {
      paymentUrl.searchParams.set('description', description)
    }
    
    // Set expiration time
    const expirationTime = Date.now() + (expiresIn * 1000)
    paymentUrl.searchParams.set('expires', expirationTime.toString())

    // Generate QR code
    const qrCodeOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl.toString(), qrCodeOptions)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      paymentUrl: paymentUrl.toString(),
      sessionId,
      expiresAt: new Date(expirationTime).toISOString(),
      shopkeeper: {
        businessName: shopkeeper.businessName,
        email: shopkeeper.email
      },
      paymentDetails: {
        amount,
        currency: currency.toUpperCase(),
        description: description || `Payment to ${shopkeeper.businessName}`
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/payment/qr-code - Get QR code for existing payment link
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentUrl = searchParams.get('url')

    if (!paymentUrl) {
      return NextResponse.json({ error: 'Payment URL is required' }, { status: 400 })
    }

    // Generate QR code for the provided URL
    const qrCodeOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, qrCodeOptions)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      paymentUrl
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error.message },
      { status: 500 }
    )
  }
}