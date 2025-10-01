import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  }
}, { _id: false })

const customerInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  }
}, { _id: false })

const saleSchema = new mongoose.Schema({
  items: {
    type: [saleItemSchema],
    required: [true, 'Sale items are required'],
    validate: {
      validator: function(items) {
        return items.length > 0
      },
      message: 'Sale must have at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'STORE_CREDIT', 'SQUARE', 'CHECK'],
    required: [true, 'Payment method is required'],
    uppercase: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED'],
    default: 'COMPLETED',
    uppercase: true
  },
  paymentGateway: {
    type: String,
    enum: ['PAYPAL', 'STRIPE', 'SQUARE', 'MANUAL'],
    uppercase: true
  },
  
  // Transaction references
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  externalTransactionId: {
    type: String,
    trim: true
  },
  
  // PayPal specific fields
  paypalOrderId: {
    type: String,
    trim: true
  },
  paypalCaptureId: {
    type: String,
    trim: true
  },
  
  // Payment processing details
  paymentProcessedAt: {
    type: Date,
    index: true
  },
  paymentNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Payment notes cannot exceed 1000 characters']
  },
  
  // Fee information
  processingFee: {
    amount: {
      type: Number,
      min: [0, 'Processing fee cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Net amount after fees
  netAmount: {
    type: Number,
    min: [0, 'Net amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  customerInfo: {
    type: customerInfoSchema,
    default: undefined
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    trim: true,
    maxlength: [20, 'Receipt number cannot be more than 20 characters']
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cashier ID is required']
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
saleSchema.index({ userId: 1, createdAt: -1 })
saleSchema.index({ userId: 1, receiptNumber: 1 }, { unique: true })
saleSchema.index({ userId: 1, paymentStatus: 1 })
saleSchema.index({ userId: 1, paymentMethod: 1 })
saleSchema.index({ cashierId: 1, createdAt: -1 })
saleSchema.index({ transactionId: 1 })
saleSchema.index({ paypalOrderId: 1 })
saleSchema.index({ paypalCaptureId: 1 })
saleSchema.index({ externalTransactionId: 1 })

// Compound indexes for complex queries
saleSchema.index({ userId: 1, paymentStatus: 1, createdAt: -1 })
saleSchema.index({ userId: 1, paymentMethod: 1, createdAt: -1 })

// Virtual for formatted amounts
saleSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.total)
})

saleSchema.virtual('formattedNetAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.netAmount || this.total)
})

// Pre-save middleware to calculate net amount
saleSchema.pre('save', function(next) {
  // Calculate net amount if not already set
  if (!this.netAmount) {
    this.netAmount = this.total - (this.processingFee?.amount || 0)
  }
  
  // Set payment processed timestamp when status changes to COMPLETED
  if (this.isModified('paymentStatus') && this.paymentStatus === 'COMPLETED' && !this.paymentProcessedAt) {
    this.paymentProcessedAt = new Date()
  }
  
  next()
})

// Static method to find sales by payment status
saleSchema.statics.findByPaymentStatus = function(userId, status, limit = 20) {
  return this.find({
    userId,
    paymentStatus: status.toUpperCase()
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('transactionId')
}

// Static method to get payment statistics
saleSchema.statics.getPaymentStats = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId)
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {}
    if (startDate) matchStage.createdAt.$gte = new Date(startDate)
    if (endDate) matchStage.createdAt.$lte = new Date(endDate)
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalNetAmount: { $sum: { $ifNull: ['$netAmount', '$total'] } },
        totalFees: { $sum: '$processingFee.amount' },
        paymentMethods: { $push: '$paymentMethod' }
      }
    }
  ])
}

// Instance method to update payment status with transaction reference
saleSchema.methods.updatePaymentStatus = async function(status, transactionId = null, notes = '') {
  this.paymentStatus = status.toUpperCase()
  
  if (transactionId) {
    this.transactionId = transactionId
  }
  
  if (notes) {
    this.paymentNotes = this.paymentNotes 
      ? `${this.paymentNotes}\n${new Date().toISOString()}: ${notes}`
      : `${new Date().toISOString()}: ${notes}`
  }
  
  if (status.toUpperCase() === 'COMPLETED') {
    this.paymentProcessedAt = new Date()
  }
  
  return await this.save()
}

// Instance method to format sale for API response
saleSchema.methods.toAPIResponse = function() {
  const sale = this.toObject()
  
  return {
    id: sale._id,
    receiptNumber: sale.receiptNumber,
    items: sale.items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    discount: sale.discount,
    total: sale.total,
    netAmount: sale.netAmount || sale.total,
    currency: sale.currency,
    formattedTotal: this.formattedTotal,
    formattedNetAmount: this.formattedNetAmount,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    paymentGateway: sale.paymentGateway,
    paymentProcessedAt: sale.paymentProcessedAt,
    processingFee: sale.processingFee,
    customerInfo: sale.customerInfo,
    transactionId: sale.transactionId,
    paypalOrderId: sale.paypalOrderId,
    paypalCaptureId: sale.paypalCaptureId,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt
  }
}

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema)

export default Sale
