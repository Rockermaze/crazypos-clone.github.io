import mongoose from 'mongoose'

const repairCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  estimatedCost: {
    type: Number,
    required: false,
    min: [0, 'Estimated cost cannot be negative'],
    default: 0
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [1, 'Estimated time must be at least 1 minute']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Create index for efficient queries
repairCategorySchema.index({ name: 1 })
repairCategorySchema.index({ isActive: 1 })

export default mongoose.models.RepairCategory || mongoose.model('RepairCategory', repairCategorySchema)
