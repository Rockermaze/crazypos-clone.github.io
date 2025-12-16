import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' // Import your auth config
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { Types } from 'mongoose' // Added for ObjectId validation

// GET /api/products/[id] - Get single product by ID
export async function GET(
  request,
  { params }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions) // Fixed: Added authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    await connectDB()
    
    const product = await Product.findOne({ 
      _id: id, 
      userId: session.user.id 
    }).lean()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Convert to response format
    const responseProduct = {
      ...product,
      id: product._id.toString(),
      _id: undefined,
      userId: undefined
    }

    return NextResponse.json({ product: responseProduct })
  } catch (error) {
    console.error('Error fetching product:', error)
    
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product by ID
export async function PUT(
  request,
  { params }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions) // Fixed: Added authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      price,
      cost,
      stock,
      barcode,
      category,
      description,
      images,
      isActive
    } = body

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) { // Fixed: Check both falsy and empty string
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    if (price !== undefined && (price < 0 || isNaN(Number(price)))) { // Fixed: Use Number() for better validation
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    if (cost !== undefined && (cost < 0 || isNaN(Number(cost)))) { // Fixed: Use Number() for better validation
      return NextResponse.json(
        { error: 'Cost must be a positive number' },
        { status: 400 }
      )
    }

    if (stock !== undefined && (stock < 0 || isNaN(Number(stock)) || !Number.isInteger(Number(stock)))) { // Fixed: Ensure integer validation
      return NextResponse.json(
        { error: 'Stock must be a positive integer' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if barcode already exists for this user (excluding current product)
    if (barcode !== undefined && barcode.trim()) { // Fixed: Check for undefined and empty string
      const existingProduct = await Product.findOne({ 
        userId: session.user.id, 
        barcode: barcode.trim(),
        _id: { $ne: id }
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'A product with this barcode already exists' },
          { status: 409 }
        )
      }
    }

    // Build update object
    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (price !== undefined) updateData.price = parseFloat(price.toString()) // Fixed: Ensure string conversion
    if (cost !== undefined) updateData.cost = parseFloat(cost.toString()) // Fixed: Ensure string conversion
    if (stock !== undefined) updateData.stock = parseInt(stock.toString(), 10) // Fixed: Added radix parameter
    if (barcode !== undefined) updateData.barcode = barcode.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (images !== undefined) updateData.images = images
    if (isActive !== undefined) updateData.isActive = isActive

    // Add updatedAt timestamp
    updateData.updatedAt = new Date()

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Convert to response format
    const responseProduct = {
      id: updatedProduct._id.toString(),
      name: updatedProduct.name,
      price: updatedProduct.price,
      cost: updatedProduct.cost,
      stock: updatedProduct.stock,
      barcode: updatedProduct.barcode,
      category: updatedProduct.category,
      description: updatedProduct.description,
      images: updatedProduct.images,
      isActive: updatedProduct.isActive,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: responseProduct
    })
  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid product ID or data format' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product by ID
export async function DELETE(
  request,
  { params }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params
    
    const session = await getServerSession(authOptions) // Fixed: Added authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    await connectDB()

    const deletedProduct = await Product.findOneAndDelete({ 
      _id: id, 
      userId: session.user.id 
    })

    if (!deletedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      productId: id 
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
