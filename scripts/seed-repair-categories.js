const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourpos'

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
    required: [true, 'Estimated cost is required'],
    min: [0, 'Estimated cost cannot be negative']
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

const RepairCategory = mongoose.models.RepairCategory || mongoose.model('RepairCategory', repairCategorySchema)

const sampleCategories = [
  {
    name: 'Screen Replacement',
    description: 'Replace cracked or damaged screen display',
    estimatedCost: 150.00,
    estimatedTime: 60
  },
  {
    name: 'Battery Replacement',
    description: 'Replace old or faulty battery',
    estimatedCost: 80.00,
    estimatedTime: 45
  },
  {
    name: 'Charging Port Repair',
    description: 'Fix or replace charging port',
    estimatedCost: 75.00,
    estimatedTime: 90
  },
  {
    name: 'Camera Repair',
    description: 'Repair or replace front/rear camera',
    estimatedCost: 120.00,
    estimatedTime: 75
  },
  {
    name: 'Water Damage Assessment',
    description: 'Diagnose and repair water damage',
    estimatedCost: 200.00,
    estimatedTime: 180
  },
  {
    name: 'Speaker Replacement',
    description: 'Replace faulty speakers',
    estimatedCost: 65.00,
    estimatedTime: 50
  },
  {
    name: 'Button Repair',
    description: 'Fix or replace power/volume buttons',
    estimatedCost: 45.00,
    estimatedTime: 30
  },
  {
    name: 'Motherboard Repair',
    description: 'Complex motherboard component repair',
    estimatedCost: 300.00,
    estimatedTime: 240
  },
  {
    name: 'Software Issues',
    description: 'Software troubleshooting and repair',
    estimatedCost: 50.00,
    estimatedTime: 60
  },
  {
    name: 'Data Recovery',
    description: 'Recover data from damaged devices',
    estimatedCost: 150.00,
    estimatedTime: 120
  }
]

async function seedRepairCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing categories
    await RepairCategory.deleteMany({})
    console.log('🧹 Cleared existing repair categories')

    // Insert sample categories
    const insertedCategories = await RepairCategory.insertMany(sampleCategories)
    console.log(`✅ Inserted ${insertedCategories.length} repair categories`)

    console.log('\n📋 Repair Categories created:')
    insertedCategories.forEach(category => {
      console.log(`  • ${category.name} - $${category.estimatedCost} (${category.estimatedTime}min)`)
    })

    console.log('\n🎉 Repair categories seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding repair categories:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

if (require.main === module) {
  seedRepairCategories()
}

module.exports = { seedRepairCategories }