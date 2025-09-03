import { NextRequest, NextResponse } from 'next/server'

// Mock sales data - In a real app, this would be in a database
let sales: Array<{
  id: number
  items: Array<{ productId: number, name: string, price: number, quantity: number }>
  total: number
  timestamp: string
  paymentMethod: string
}> = []

export async function GET() {
  return NextResponse.json({ sales })
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    if (action === 'create') {
      const { items, total, paymentMethod } = data
      
      const newSale = {
        id: sales.length + 1,
        items,
        total,
        paymentMethod,
        timestamp: new Date().toISOString()
      }
      
      sales.push(newSale)
      
      return NextResponse.json({ 
        success: true, 
        sale: newSale,
        message: 'Sale completed successfully' 
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Sales API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
