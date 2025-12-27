import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { products } = await request.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Validate all products before attempting to save
    const validationErrors = []
    const barcodes = new Set()
    const duplicateBarcodes = new Set()

    products.forEach((product, index) => {
      const errors = []

      // Required fields
      if (!product.name || product.name.trim() === '') {
        errors.push('Name is required')
      }
      if (product.price === undefined || product.price === null) {
        errors.push('Price is required')
      }
      if (!product.barcode || product.barcode.trim() === '') {
        errors.push('Barcode is required')
      }

      // Validation rules
      if (product.price < 0) {
        errors.push('Price cannot be negative')
      }
      if (product.cost && product.cost < 0) {
        errors.push('Cost cannot be negative')
      }
      if (product.stock !== undefined && product.stock < 0) {
        errors.push('Stock cannot be negative')
      }

      // Check for duplicate barcodes within the import
      if (product.barcode) {
        if (barcodes.has(product.barcode)) {
          duplicateBarcodes.add(product.barcode)
          errors.push(`Duplicate barcode in import: ${product.barcode}`)
        }
        barcodes.add(product.barcode)
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: index + 1,
          product: product.name || 'Unnamed',
          errors
        })
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors
        },
        { status: 400 }
      )
    }

    // Check for existing barcodes in database
    const existingProducts = await Product.find({
      userId: session.user.id,
      barcode: { $in: Array.from(barcodes) }
    }).select('barcode name')

    if (existingProducts.length > 0) {
      const existingBarcodes = existingProducts.map(p => ({
        barcode: p.barcode,
        existingProduct: p.name
      }))

      return NextResponse.json(
        {
          error: 'Duplicate barcodes found',
          message: 'Some barcodes already exist in your inventory',
          duplicates: existingBarcodes
        },
        { status: 409 }
      )
    }

    // Prepare products for insertion
    const productsToInsert = products.map(product => ({
      name: product.name.trim(),
      price: Number(product.price),
      cost: product.cost !== undefined ? Number(product.cost) : 0,
      stock: product.stock !== undefined ? Number(product.stock) : 0,
      barcode: product.barcode.trim(),
      category: product.category?.trim() || 'General',
      description: product.description?.trim() || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      userId: session.user.id
    }))

    // Bulk insert
    const result = await Product.insertMany(productsToInsert, { ordered: false })

    return NextResponse.json(
      {
        message: `Successfully imported ${result.length} products`,
        count: result.length,
        products: result
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Bulk import error:', error)

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        {
          error: 'Duplicate barcode detected',
          message: 'One or more barcodes already exist in your inventory'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to import products', details: error.message },
      { status: 500 }
    )
  }
}
