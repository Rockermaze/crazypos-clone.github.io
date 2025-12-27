import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  receiptNumber: {
    type: Number,
    required: [true, 'Receipt number counter is required'],
    min: [1, 'Receipt number must start from 1'],
    default: 1
  },
  ticketNumber: {
    type: Number,
    required: [true, 'Ticket number counter is required'],
    min: [1, 'Ticket number must start from 1'],
    default: 1
  },
  productId: {
    type: Number,
    required: [true, 'Product ID counter is required'],
    min: [1, 'Product ID must start from 1'],
    default: 1
  },
  customerId: {
    type: Number,
    required: [true, 'Customer ID counter is required'],
    min: [1, 'Customer ID must start from 1'],
    default: 1
  }
}, {
  timestamps: true
})

// Create indexes for better performance
counterSchema.index({ userId: 1 }, { unique: true })

// Static method to get next sequence number
counterSchema.statics.getNextSequence = async function(sequenceType, userId) {
  const fieldMap = {
    'receipt': 'receiptNumber',
    'ticket': 'ticketNumber',
    'product': 'productId',
    'customer': 'customerId'
  }
  
  const field = fieldMap[sequenceType]
  if (!field) {
    throw new Error(`Invalid sequence type: ${sequenceType}`)
  }
  
  // Find and update counter, creating if it doesn't exist
  const counter = await this.findOneAndUpdate(
    { userId },
    { $inc: { [field]: 1 } },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  )
  
  return counter[field]
}

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

export default Counter
