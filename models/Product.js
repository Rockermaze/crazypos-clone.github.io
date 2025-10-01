import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  barcode: {
    type: String,
    required: [true, 'Barcode is required'],
    trim: true,
    maxlength: [50, 'Barcode cannot be more than 50 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot be more than 100 characters'],
    default: 'General'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
})

// Create indexes for better performance
productSchema.index({ userId: 1, category: 1 })
productSchema.index({ userId: 1, name: 'text', description: 'text' })

// Ensure barcode is unique per user
productSchema.index({ userId: 1, barcode: 1 }, { unique: true })

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

export default Product
