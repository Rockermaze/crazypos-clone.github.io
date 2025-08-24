import { NextRequest, NextResponse } from 'next/server'

// Mock product data - In a real app, this would be in a database
let products = [
  { id: 1, name: 'iPhone 15 Pro', price: 999, stock: 25, barcode: '123456789', category: 'Phones' },
  { id: 2, name: 'Samsung Galaxy S24', price: 899, stock: 15, barcode: '987654321', category: 'Phones' },
  { id: 3, name: 'iPad Air', price: 599, stock: 10, barcode: '456789123', category: 'Tablets' },
  { id: 4, name: 'MacBook Air', price: 1299, stock: 5, barcode: '789123456', category: 'Laptops' },
  { id: 5, name: 'AirPods Pro', price: 249, stock: 30, barcode: '111222333', category: 'Accessories' },
  { id: 6, name: 'iPhone Case', price: 29, stock: 50, barcode: '444555666', category: 'Accessories' },
]

export async function GET() {
  return NextResponse.json({ products })
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    if (action === 'create') {
      const { name, price, stock, barcode, category } = data
      
      const newProduct = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        barcode,
        category
      }
      
      products.push(newProduct)
      
      return NextResponse.json({ 
        success: true, 
        product: newProduct,
        message: 'Product created successfully' 
      })
    }

    if (action === 'update') {
      const { id, name, price, stock, barcode, category } = data
      
      const productIndex = products.findIndex(p => p.id === id)
      if (productIndex === -1) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      products[productIndex] = {
        ...products[productIndex],
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        barcode,
        category
      }

      return NextResponse.json({ 
        success: true, 
        product: products[productIndex],
        message: 'Product updated successfully' 
      })
    }

    if (action === 'delete') {
      const { id } = data
      
      const productIndex = products.findIndex(p => p.id === id)
      if (productIndex === -1) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      products.splice(productIndex, 1)

      return NextResponse.json({ 
        success: true,
        message: 'Product deleted successfully' 
      })
    }

    if (action === 'update-stock') {
      const { id, change } = data // change can be positive or negative
      
      const product = products.find(p => p.id === id)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      product.stock = Math.max(0, product.stock + change)

      return NextResponse.json({ 
        success: true, 
        product,
        message: 'Stock updated successfully' 
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
Dont add any content keep it blank do noy add any stuff like products or customers etc make sure I can do it but do not do it now.
