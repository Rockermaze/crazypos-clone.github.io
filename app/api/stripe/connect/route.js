import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import User from '../../../../models/User'
import { connectToDatabase } from '../../../../lib/mongodb'
import { createConnectedAccount, createAccountLink, getAccountDetails } from '../../../../lib/stripe'

// POST /api/stripe/connect - Create Stripe Connect account
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a Stripe account
    if (user.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Stripe account already exists',
        accountId: user.stripeAccountId,
        status: user.stripeAccountStatus
      }, { status: 400 })
    }

    const body = await request.json()
    const { country = 'US', businessType = 'individual' } = body

    // Create Stripe Connect account
    const userData = {
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      country,
      businessType
    }

    const account = await createConnectedAccount(userData)

    // Update user in database
    user.stripeAccountId = account.id
    user.stripeAccountStatus = 'pending'
    user.businessDetails = {
      ...user.businessDetails,
      country,
      businessType
    }
    
    await user.save()

    return NextResponse.json({
      success: true,
      accountId: account.id,
      status: 'pending',
      message: 'Stripe Connect account created successfully'
    })

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/stripe/connect - Get Stripe Connect account status
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.stripeAccountId) {
      return NextResponse.json({
        hasAccount: false,
        status: 'not_created',
        chargesEnabled: false,
        payoutsEnabled: false
      })
    }

    // Get account details from Stripe
    try {
      const account = await getAccountDetails(user.stripeAccountId)
      
      // Update user status based on Stripe account
      const accountStatus = account.charges_enabled && account.payouts_enabled ? 'active' : 
                           account.requirements.disabled_reason ? 'restricted' : 'pending'
      
      user.stripeAccountStatus = accountStatus
      user.stripeChargesEnabled = account.charges_enabled
      user.stripePayoutsEnabled = account.payouts_enabled
      await user.save()

      return NextResponse.json({
        hasAccount: true,
        accountId: user.stripeAccountId,
        status: accountStatus,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
        businessProfile: account.business_profile
      })

    } catch (stripeError) {
      console.error('Error fetching Stripe account:', stripeError)
      return NextResponse.json({
        hasAccount: true,
        accountId: user.stripeAccountId,
        status: 'error',
        error: 'Failed to fetch account status from Stripe'
      })
    }

  } catch (error) {
    console.error('Error getting Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to get account status', details: error.message },
      { status: 500 }
    )
  }
}