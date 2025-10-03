import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import User from '../../../../models/User'
import { connectToDatabase } from '../../../../lib/mongodb'
import { createAccountLink } from '../../../../lib/stripe'

// POST /api/stripe/onboard - Create onboarding link
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

    if (!user.stripeAccountId) {
      return NextResponse.json({ error: 'No Stripe account found. Please create one first.' }, { status: 400 })
    }

    const body = await request.json()
    const { returnUrl, refreshUrl } = body

    // Default URLs if not provided
    const defaultReturnUrl = `${process.env.NEXTAUTH_URL}/dashboard/payments/success`
    const defaultRefreshUrl = `${process.env.NEXTAUTH_URL}/dashboard/payments/onboard`

    try {
      const accountLink = await createAccountLink(
        user.stripeAccountId,
        refreshUrl || defaultRefreshUrl,
        returnUrl || defaultReturnUrl
      )

      return NextResponse.json({
        success: true,
        url: accountLink.url,
        expires_at: accountLink.expires_at
      })

    } catch (stripeError) {
      console.error('Error creating account link:', stripeError)
      return NextResponse.json(
        { error: 'Failed to create onboarding link', details: stripeError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating onboarding link:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding link', details: error.message },
      { status: 500 }
    )
  }
}