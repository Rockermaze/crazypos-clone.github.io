import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import User from '@/models/User'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get current user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    let dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // End of day
        dateFilter.createdAt.$lte = end
      }
    }

    // Get sales for the user
    const sales = await Sale.find({
      cashierId: user._id,
      ...dateFilter
    }).sort({ createdAt: -1 })

    // Get all unique product IDs from sales
    const productIds = [...new Set(
      sales.flatMap(sale => 
        sale.items.map(item => item.productId)
      )
    )]

    // Get product cost data
    const products = await Product.find({
      _id: { $in: productIds },
      userId: user._id
    }).select('_id cost')

    // Create a map of product costs
    const productCostMap = products.reduce((map, product) => {
      map[product._id.toString()] = product.cost || 0
      return map
    }, {})

    // Calculate profit for each sale
    const salesWithProfit = sales.map(sale => {
      let totalCost = 0
      let totalProfit = 0

      // Calculate cost and profit for each item
      const itemsWithProfit = sale.items.map(item => {
        const productCost = productCostMap[item.productId] || 0
        const itemCost = productCost * item.quantity
        const itemProfit = item.totalPrice - itemCost

        totalCost += itemCost
        totalProfit += itemProfit

        return {
          ...item,
          productCost,
          itemCost,
          itemProfit,
          profitMargin: item.totalPrice > 0 ? (itemProfit / item.totalPrice * 100) : 0
        }
      })

      const profitMargin = sale.total > 0 ? (totalProfit / sale.total * 100) : 0

      return {
        ...sale.toObject(),
        items: itemsWithProfit,
        totalCost,
        totalProfit,
        profitMargin
      }
    })

    // Calculate summary statistics with tax separation
    const totalTax = sales.reduce((sum, sale) => sum + (sale.tax || 0), 0)
    const totalSubtotal = sales.reduce((sum, sale) => sum + sale.subtotal, 0)
    
    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalSubtotal: totalSubtotal,
      totalTax: totalTax,
      totalCost: salesWithProfit.reduce((sum, sale) => sum + sale.totalCost, 0),
      totalProfit: salesWithProfit.reduce((sum, sale) => sum + sale.totalProfit, 0),
      grossProfit: totalSubtotal - salesWithProfit.reduce((sum, sale) => sum + sale.totalCost, 0), // Profit before tax
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      profitMargin: 0,
      grossProfitMargin: 0
    }

    summary.profitMargin = summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue * 100) : 0
    summary.grossProfitMargin = totalSubtotal > 0 ? (summary.grossProfit / totalSubtotal * 100) : 0

    return NextResponse.json({
      sales: salesWithProfit,
      summary
    })

  } catch (error) {
    console.error('Error fetching sales with profit:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch sales data' 
    }, { status: 500 })
  }
}
