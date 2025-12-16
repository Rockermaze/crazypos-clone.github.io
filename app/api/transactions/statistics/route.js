import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

/**
 * GET /api/transactions/statistics
 * Retrieves transaction statistics and analytics
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'month' // day, week, month, year
    
    // Connect to database
    await connectDB()

    // Build date filter
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
    } else {
      // Default to last 30 days if no dates specified
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      dateFilter.createdAt = { $gte: thirtyDaysAgo }
    }

    // Base match stage
    const baseMatch = {
      userId: session.user.id,
      ...dateFilter
    }

    // Execute multiple aggregations concurrently
    const [
      overallStats,
      statusBreakdown,
      paymentMethodBreakdown,
      typeBreakdown,
      recentTransactions,
      timeSeriesData,
      topCustomers
    ] = await Promise.all([
      // Overall statistics
      Transaction.aggregate([
        { $match: { ...baseMatch, status: 'COMPLETED' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalNetAmount: { $sum: '$netAmount' },
            totalFees: { $sum: '$fee.amount' },
            transactionCount: { $sum: 1 },
            averageAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' }
          }
        }
      ]),

      // Status breakdown
      Transaction.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // Payment method breakdown
      Transaction.aggregate([
        { $match: { ...baseMatch, status: 'COMPLETED' } },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
            netAmount: { $sum: '$netAmount' }
          }
        }
      ]),

      // Transaction type breakdown
      Transaction.aggregate([
        { $match: { ...baseMatch, status: 'COMPLETED' } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // Recent transactions
      Transaction.find(baseMatch)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('transactionId amount currency type status paymentMethod description createdAt')
        .lean(),

      // Time series data
      getTimeSeriesData(baseMatch, period),

      // Top customers
      Transaction.aggregate([
        { $match: { ...baseMatch, status: 'COMPLETED' } },
        {
          $group: {
            _id: '$customer.email',
            customerName: { $first: '$customer.name' },
            transactionCount: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        },
        { $match: { _id: { $ne: null, $ne: '' } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
      ])
    ])

    // Format the response
    const overallData = overallStats[0] || {
      totalAmount: 0,
      totalNetAmount: 0,
      totalFees: 0,
      transactionCount: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0
    }
    
    // Ensure all values are numbers and handle null/undefined
    const statistics = {
      overall: {
        totalAmount: Number(overallData.totalAmount || 0),
        totalNetAmount: Number(overallData.totalNetAmount || 0),
        totalFees: Number(overallData.totalFees || 0),
        transactionCount: Number(overallData.transactionCount || 0),
        averageAmount: Number(overallData.averageAmount || 0),
        minAmount: Number(overallData.minAmount || 0),
        maxAmount: Number(overallData.maxAmount || 0)
      },
      statusBreakdown: statusBreakdown.map(item => ({
        status: item._id,
        count: item.count,
        amount: item.amount,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(item.amount)
      })),
      paymentMethodBreakdown: paymentMethodBreakdown.map(item => ({
        method: item._id,
        count: item.count,
        amount: item.amount,
        netAmount: item.netAmount,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(item.amount)
      })),
      typeBreakdown: typeBreakdown.map(item => ({
        type: item._id,
        count: item.count,
        amount: item.amount,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(item.amount)
      })),
      recentTransactions: recentTransactions.map(transaction => ({
        ...transaction,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: transaction.currency || 'USD'
        }).format(transaction.amount)
      })),
      timeSeries: timeSeriesData,
      topCustomers: topCustomers.map(customer => ({
        email: customer._id,
        name: customer.customerName,
        transactionCount: customer.transactionCount,
        totalAmount: customer.totalAmount,
        averageAmount: customer.averageAmount,
        formattedTotalAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(customer.totalAmount),
        formattedAverageAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(customer.averageAmount)
      })),
      dateRange: {
        startDate: dateFilter.createdAt?.$gte?.toISOString() || null,
        endDate: dateFilter.createdAt?.$lte?.toISOString() || null,
        period
      }
    }

    // Add formatted amounts to overall stats (always format, even if 0)
    statistics.overall.formattedTotalAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(statistics.overall.totalAmount)
    
    statistics.overall.formattedTotalNetAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(statistics.overall.totalNetAmount)
    
    statistics.overall.formattedAverageAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(statistics.overall.averageAmount)
    
    statistics.overall.formattedTotalFees = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(statistics.overall.totalFees)
    
    // Verify calculation accuracy: totalNetAmount should equal totalAmount - totalFees
    const calculatedNetAmount = statistics.overall.totalAmount - statistics.overall.totalFees
    if (Math.abs(statistics.overall.totalNetAmount - calculatedNetAmount) > 0.01) {
      console.warn('Net amount mismatch detected:', {
        totalAmount: statistics.overall.totalAmount,
        totalFees: statistics.overall.totalFees,
        storedNetAmount: statistics.overall.totalNetAmount,
        calculatedNetAmount
      })
      // Use calculated value as source of truth
      statistics.overall.totalNetAmount = calculatedNetAmount
      statistics.overall.formattedTotalNetAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(calculatedNetAmount)
    }

    return NextResponse.json({
      success: true,
      data: statistics
    })

  } catch (error) {
    console.error('Get Transaction Statistics Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get time series data for charts
 */
async function getTimeSeriesData(baseMatch, period) {
  let groupFormat
  let sortOrder = 1

  switch (period) {
    case 'day':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      }
      break
    case 'week':
      groupFormat = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      }
      break
    case 'month':
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      }
      break
    case 'year':
      groupFormat = {
        year: { $year: '$createdAt' }
      }
      break
    default:
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      }
  }

  return await Transaction.aggregate([
    { $match: { ...baseMatch, status: 'COMPLETED' } },
    {
      $group: {
        _id: groupFormat,
        amount: { $sum: '$amount' },
        netAmount: { $sum: '$netAmount' },
        count: { $sum: 1 },
        fees: { $sum: '$fee.amount' }
      }
    },
    { $sort: { '_id': sortOrder } },
    {
      $project: {
        period: '$_id',
        amount: 1,
        netAmount: 1,
        count: 1,
        fees: 1,
        _id: 0
      }
    }
  ])
}