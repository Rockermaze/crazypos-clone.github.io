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
    min: [1000, 'Receipt number must start from 1000'],
    default: 1000
  },
  ticketNumber: {
    type: Number,
    required: [true, 'Ticket number counter is required'],
    min: [1000, 'Ticket number must start from 1000'],
    default: 1000
  },
  productId: {
    type: Number,
    required: [true, 'Product ID counter is required'],
    min: [1000, 'Product ID must start from 1000'],
    default: 1000
  }
}, {
  timestamps: true
})

// Create indexes for better performance
counterSchema.index({ userId: 1 }, { unique: true })

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

export default Counter
