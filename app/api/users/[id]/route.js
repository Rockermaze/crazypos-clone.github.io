import { NextResponse } from 'next/server'
import User from '../../../../models/User'
import { connectToDatabase } from '../../../../lib/mongodb'

// GET /api/users/[id] - Get user information for payments
export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await connectToDatabase()
    
    const user = await User.findById(id).select([
      '_id',
      'name',
      'businessName', 
      'email',
      'stripeAccountId',
      'stripeAccountStatus',
      'stripeChargesEnabled',
      'stripePayoutsEnabled',
      'platformFeePercentage',
      'businessDetails'
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only return public information for payment purposes
    const publicUserData = {
      id: user._id.toString(),
      businessName: user.businessName,
      email: user.email,
      stripeAccountStatus: user.stripeAccountStatus,
      acceptsOnlinePayments: user.stripeAccountStatus === 'active' && user.stripeChargesEnabled,
      platformFeePercentage: user.platformFeePercentage || 1.5,
      currency: user.businessDetails?.currency || 'usd'
    }

    return NextResponse.json(publicUserData)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user information', details: error.message },
      { status: 500 }
    )
  }
}