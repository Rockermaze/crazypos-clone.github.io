import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' // Import your auth config
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Counter from '@/models/Counter'

// GET /api/products - Get all products for authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions) // Fixed: Added authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')

    // Build query
    let query = { userId: session.user.id }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true'
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ]
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Convert MongoDB ObjectIds to strings
    const serializedProducts = products.map(product => ({
      ...product,
      id: product._id.toString(),
      _id: undefined,
      userId: undefined // Don't send userId back to client
    }))

    return NextResponse.json({ products: serializedProducts })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions) // Fixed: Added authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      price,
      cost = 0,
      stock = 0,
      barcode,
      category = 'General',
      description = '',
      images = [],
      isActive = true
    } = body

    // Validate required fields
    if (!name || price === undefined || !barcode) { // Fixed: Check price === undefined instead of !price
      return NextResponse.json(
        { error: 'Name, price, and barcode are required' },
        { status: 400 }
      )
    }

    if (price < 0 || cost < 0 || stock < 0) {
      return NextResponse.json(
        { error: 'Price, cost, and stock cannot be negative' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if barcode already exists for this user
    const existingProduct = await Product.findOne({ 
      userId: session.user.id, 
      barcode: barcode.trim() // Fixed: Ensure consistent barcode comparison
    })
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this barcode already exists' },
        { status: 409 }
      )
    }

    // Create new product
    const newProduct = new Product({
      name: name.trim(),
      price: parseFloat(price.toString()), // Fixed: Ensure string conversion before parseFloat
      cost: parseFloat(cost.toString()),
      stock: parseInt(stock.toString(), 10), // Fixed: Added radix parameter
      barcode: barcode.trim(),
      category: category.trim(),
      description: description.trim(),
      images,
      isActive,
      userId: session.user.id
    })

    const savedProduct = await newProduct.save()

    // Convert to response format
    const responseProduct = {
      id: savedProduct._id.toString(),
      name: savedProduct.name,
      price: savedProduct.price,
      cost: savedProduct.cost,
      stock: savedProduct.stock,
      barcode: savedProduct.barcode,
      category: savedProduct.category,
      description: savedProduct.description,
      images: savedProduct.images,
      isActive: savedProduct.isActive,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt
    }

    return NextResponse.json(
      { 
        message: 'Product created successfully', 
        product: responseProduct 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating product:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
