import mongoose from 'mongoose'
import Counter from './Counter.js'

const purchaseRecordSchema = new mongoose.Schema({
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    trim: true
  }
}, { _id: false })

const paymentRecordSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'ONLINE', 'DEBIT_CARD', 'CREDIT_CARD', 'STORE_CREDIT', 'STRIPE'],
    required: true,
    uppercase: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false })

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    required: false,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    index: true,
    validate: {
      validator: function(v) {
        // Allow empty/null email
        if (!v || v.trim() === '') return true
        // Validate email format if provided
        return /^\S+@\S+\.\S+$/.test(v)
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'US' }
  },
  // Financial tracking
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, 'Due amount cannot be negative']
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Total purchases cannot be negative']
  },
  purchaseCount: {
    type: Number,
    default: 0,
    min: [0, 'Purchase count cannot be negative']
  },
  // Purchase history
  purchaseHistory: {
    type: [purchaseRecordSchema],
    default: []
  },
  // Payment history for due amounts
  paymentHistory: {
    type: [paymentRecordSchema],
    default: []
  },
  // Customer notes and preferences
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  tags: {
    type: [String],
    default: []
  },
  // Customer status
  isActive: {
    type: Boolean,
    default: true
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  // Business reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  // Last interaction
  lastPurchaseDate: {
    type: Date,
    index: true
  },
  lastContactDate: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
customerSchema.index({ userId: 1, phone: 1 }, { unique: true })
customerSchema.index({ userId: 1, email: 1 }, { sparse: true })
customerSchema.index({ userId: 1, customerId: 1 })
customerSchema.index({ userId: 1, isActive: 1 })
customerSchema.index({ userId: 1, dueAmount: 1 })
customerSchema.index({ userId: 1, lastPurchaseDate: -1 })

// Text index for search
customerSchema.index({ name: 'text', phone: 'text', email: 'text' })

// Pre-save middleware to clean up email and generate customerId
customerSchema.pre('save', async function(next) {
  // Convert empty email string to undefined to avoid validation issues
  if (this.email === '' || (typeof this.email === 'string' && this.email.trim() === '')) {
    this.email = undefined
  }
  
  // Generate customerId for new customers
  if (this.isNew && !this.customerId) {
    try {
      const counter = await Counter.getNextSequence('customer', this.userId)
      this.customerId = `CUST-${counter.toString().padStart(5, '0')}`
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// Virtual for customer display name
customerSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.customerId})`
})

// Virtual for formatted due amount
customerSchema.virtual('formattedDueAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.dueAmount)
})

// Virtual for average purchase value
customerSchema.virtual('averagePurchaseValue').get(function() {
  if (this.purchaseCount === 0) return 0
  return this.totalPurchases / this.purchaseCount
})

// Instance method to add purchase
customerSchema.methods.addPurchase = async function(saleId, amount, receiptNumber) {
  this.purchaseHistory.push({
    saleId,
    amount,
    receiptNumber,
    date: new Date()
  })
  
  this.totalPurchases += amount
  this.purchaseCount += 1
  this.lastPurchaseDate = new Date()
  
  // Keep only last 100 purchases in history
  if (this.purchaseHistory.length > 100) {
    this.purchaseHistory = this.purchaseHistory.slice(-100)
  }
  
  return await this.save()
}

// Instance method to add payment towards due amount
customerSchema.methods.addPayment = async function(amount, paymentMethod, notes, recordedBy) {
  if (amount > this.dueAmount) {
    throw new Error('Payment amount cannot exceed due amount')
  }
  
  this.paymentHistory.push({
    amount,
    paymentMethod,
    notes,
    recordedBy,
    date: new Date()
  })
  
  this.dueAmount -= amount
  
  // Keep only last 50 payments in history
  if (this.paymentHistory.length > 50) {
    this.paymentHistory = this.paymentHistory.slice(-50)
  }
  
  return await this.save()
}

// Instance method to add due amount
customerSchema.methods.addDue = async function(amount, reason) {
  this.dueAmount += amount
  
  if (reason) {
    this.notes = this.notes 
      ? `${this.notes}\n${new Date().toISOString()}: Added due $${amount} - ${reason}`
      : `${new Date().toISOString()}: Added due $${amount} - ${reason}`
  }
  
  return await this.save()
}

// Static method to find customer by phone or email
customerSchema.statics.findByContact = async function(userId, contact) {
  // Try to find by phone first
  let customer = await this.findOne({ 
    userId, 
    phone: contact,
    isActive: true 
  })
  
  // If not found and contact looks like email, try email
  if (!customer && contact.includes('@')) {
    customer = await this.findOne({ 
      userId, 
      email: contact.toLowerCase(),
      isActive: true 
    })
  }
  
  return customer
}

// Static method to get customers with due amounts
customerSchema.statics.getCustomersWithDues = function(userId, limit = 50) {
  return this.find({
    userId,
    dueAmount: { $gt: 0 },
    isActive: true
  })
  .sort({ dueAmount: -1 })
  .limit(limit)
}

// Static method to get top customers
customerSchema.statics.getTopCustomers = function(userId, limit = 10) {
  return this.find({
    userId,
    isActive: true
  })
  .sort({ totalPurchases: -1, purchaseCount: -1 })
  .limit(limit)
}

// Static method to search customers
customerSchema.statics.searchCustomers = async function(userId, query, limit = 20) {
  const searchRegex = new RegExp(query, 'i')
  
  return await this.find({
    userId,
    isActive: true,
    $or: [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { customerId: searchRegex }
    ]
  })
  .sort({ lastPurchaseDate: -1, createdAt: -1 })
  .limit(limit)
}

// Static method to get customer statistics
customerSchema.statics.getCustomerStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        totalDueAmount: { $sum: '$dueAmount' },
        totalPurchaseValue: { $sum: '$totalPurchases' },
        averagePurchaseValue: { $avg: '$totalPurchases' },
        customersWithDues: {
          $sum: { $cond: [{ $gt: ['$dueAmount', 0] }, 1, 0] }
        }
      }
    }
  ])
  
  return stats[0] || {
    totalCustomers: 0,
    totalDueAmount: 0,
    totalPurchaseValue: 0,
    averagePurchaseValue: 0,
    customersWithDues: 0
  }
}

// Instance method to format for API response
customerSchema.methods.toAPIResponse = function() {
  const customer = this.toObject()
  
  return {
    id: customer._id,
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    dueAmount: customer.dueAmount,
    formattedDueAmount: this.formattedDueAmount,
    totalPurchases: customer.totalPurchases,
    purchaseCount: customer.purchaseCount,
    averagePurchaseValue: this.averagePurchaseValue,
    purchaseHistory: customer.purchaseHistory,
    paymentHistory: customer.paymentHistory,
    notes: customer.notes,
    tags: customer.tags,
    isActive: customer.isActive,
    loyaltyPoints: customer.loyaltyPoints,
    lastPurchaseDate: customer.lastPurchaseDate,
    lastContactDate: customer.lastContactDate,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  }
}

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema)

export default Customer
