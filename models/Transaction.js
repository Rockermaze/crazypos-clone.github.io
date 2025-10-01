import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  // Transaction identifiers
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
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
  paypalPaymentId: {
    type: String,
    trim: true,
    index: true
  },
  
  // User and business references
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Sale reference (if applicable)
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    index: true
  },
  
  // Transaction details
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'],
    uppercase: true
  },
  
  // Transaction type and status
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['SALE', 'REFUND', 'PARTIAL_REFUND', 'PAYMENT', 'TRANSFER', 'FEE'],
    uppercase: true
  },
  status: {
    type: String,
    required: [true, 'Transaction status is required'],
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING',
    uppercase: true,
    index: true
  },
  
  // Payment method and gateway
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['PAYPAL', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK'],
    uppercase: true,
    index: true
  },
  paymentGateway: {
    type: String,
    enum: ['PAYPAL', 'STRIPE', 'SQUARE', 'MANUAL', 'BRAINTREE'],
    default: 'PAYPAL',
    uppercase: true
  },
  
  // Transaction description and notes
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Fee information
  fee: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Fee amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['PROCESSING_FEE', 'GATEWAY_FEE', 'TRANSACTION_FEE', 'SERVICE_FEE'],
      uppercase: true
    }
  },
  
  // Net amount (amount - fees)
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required']
  },
  
  // Customer information
  customer: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Customer name cannot exceed 200 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  
  // PayPal specific response data
  paypalData: {
    intent: String,
    status: String,
    purchase_units: [{
      reference_id: String,
      amount: {
        currency_code: String,
        value: String
      },
      payee: {
        email_address: String,
        merchant_id: String
      }
    }],
    payer: {
      name: {
        given_name: String,
        surname: String
      },
      email_address: String,
      payer_id: String,
      address: {
        country_code: String
      }
    },
    create_time: Date,
    update_time: Date,
    links: [{
      href: String,
      rel: String,
      method: String
    }]
  },
  
  // Refund information
  refund: {
    amount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Refund reason cannot exceed 500 characters']
    },
    refundedAt: Date,
    refundId: String
  },
  
  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  processedAt: {
    type: Date,
    index: true
  },
  
  // IP address and user agent for security
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
transactionSchema.index({ userId: 1, status: 1 })
transactionSchema.index({ userId: 1, type: 1 })
transactionSchema.index({ userId: 1, paymentMethod: 1 })
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ paypalOrderId: 1 })
transactionSchema.index({ paypalCaptureId: 1 })
transactionSchema.index({ transactionId: 1 }, { unique: true })

// Compound index for reporting
transactionSchema.index({ 
  userId: 1, 
  status: 1, 
  type: 1, 
  createdAt: -1 
})

// Text search index
transactionSchema.index({
  description: 'text',
  notes: 'text',
  'customer.name': 'text',
  'customer.email': 'text'
})

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.amount)
})

// Virtual for formatted net amount
transactionSchema.virtual('formattedNetAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.netAmount)
})

// Pre-save middleware to calculate net amount
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('fee.amount')) {
    this.netAmount = this.amount - (this.fee?.amount || 0)
  }
  
  // Set processedAt when status changes to COMPLETED
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.processedAt) {
    this.processedAt = new Date()
  }
  
  next()
})

// Static method to generate transaction ID
transactionSchema.statics.generateTransactionId = function() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `TXN_${timestamp}_${randomStr}`.toUpperCase()
}

// Static method to get transaction statistics
transactionSchema.statics.getStatistics = async function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    status: 'COMPLETED'
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
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalFees: { $sum: '$fee.amount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        paymentMethods: {
          $push: '$paymentMethod'
        }
      }
    },
    {
      $addFields: {
        paymentMethodCounts: {
          $arrayToObject: {
            $map: {
              input: {
                $setUnion: '$paymentMethods'
              },
              as: 'method',
              in: {
                k: '$$method',
                v: {
                  $size: {
                    $filter: {
                      input: '$paymentMethods',
                      cond: { $eq: ['$$this', '$$method'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ])
}

// Instance method to format transaction for API response
transactionSchema.methods.toAPIResponse = function() {
  const transaction = this.toObject()
  
  return {
    id: transaction._id,
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    netAmount: transaction.netAmount,
    currency: transaction.currency,
    formattedAmount: this.formattedAmount,
    formattedNetAmount: this.formattedNetAmount,
    type: transaction.type,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    description: transaction.description,
    customer: transaction.customer,
    fee: transaction.fee,
    createdAt: transaction.createdAt,
    processedAt: transaction.processedAt,
    paypalOrderId: transaction.paypalOrderId,
    saleId: transaction.saleId
  }
}

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)

export default Transaction