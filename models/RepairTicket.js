import mongoose from 'mongoose'

const partUsedSchema = new mongoose.Schema({
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true,
    maxlength: [200, 'Part name cannot be more than 200 characters']
  },
  cost: {
    type: Number,
    required: [true, 'Part cost is required'],
    min: [0, 'Part cost cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Part quantity is required'],
    min: [1, 'Part quantity must be at least 1']
  }
}, { _id: false })

const customerInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
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
    required: [true, 'Customer phone is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  }
}, { _id: false })

const deviceInfoSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: [true, 'Device brand is required'],
    trim: true,
    maxlength: [100, 'Brand cannot be more than 100 characters']
  },
  model: {
    type: String,
    required: [true, 'Device model is required'],
    trim: true,
    maxlength: [100, 'Model cannot be more than 100 characters']
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Serial number cannot be more than 100 characters']
  },
  imei: {
    type: String,
    trim: true,
    maxlength: [20, 'IMEI cannot be more than 20 characters']
  },
  condition: {
    type: String,
    required: [true, 'Device condition is required'],
    trim: true,
    maxlength: [200, 'Condition cannot be more than 200 characters']
  },
  issueDescription: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [1000, 'Issue description cannot be more than 1000 characters']
  }
}, { _id: false })

const repairTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: [true, 'Ticket number is required'],
    trim: true,
    maxlength: [20, 'Ticket number cannot be more than 20 characters']
  },
  customerInfo: {
    type: customerInfoSchema,
    required: [true, 'Customer information is required']
  },
  deviceInfo: {
    type: deviceInfoSchema,
    required: [true, 'Device information is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'waiting-parts', 'completed', 'picked-up', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairCategory'
  },
  categoryName: {
    type: String,
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required'],
    min: [0, 'Estimated cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative']
  },
  partsUsed: {
    type: [partUsedSchema],
    default: []
  },
  laborCost: {
    type: Number,
    required: [true, 'Labor cost is required'],
    min: [0, 'Labor cost cannot be negative'],
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters'],
    default: ''
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  dateReceived: {
    type: Date,
    required: [true, 'Date received is required'],
    default: Date.now
  },
  estimatedCompletion: {
    type: Date
  },
  actualCompletion: {
    type: Date
  }
}, {
  timestamps: true
})

// Create indexes for better performance
repairTicketSchema.index({ userId: 1, createdAt: -1 })
repairTicketSchema.index({ userId: 1, ticketNumber: 1 }, { unique: true })
repairTicketSchema.index({ userId: 1, status: 1 })
repairTicketSchema.index({ technicianId: 1, status: 1 })
repairTicketSchema.index({ userId: 1, priority: 1 })

// Auto-update completion date when status changes to completed
repairTicketSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.actualCompletion) {
    this.actualCompletion = new Date()
  }
  next()
})

const RepairTicket = mongoose.models.RepairTicket || mongoose.model('RepairTicket', repairTicketSchema)

export default RepairTicket
