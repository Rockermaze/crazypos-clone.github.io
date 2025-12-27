import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Customer from '@/models/Customer'

// GET /api/customers/statistics - Get customer statistics
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const stats = await Customer.getCustomerStats(session.user.id)

    return NextResponse.json({
      success: true,
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching customer statistics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
