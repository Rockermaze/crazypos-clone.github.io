const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rockermaze:Ronnieis2@cluster0.kcm4lxc.mongodb.net/YourPOS?retryWrites=true&w=majority&appName=Cluster0'

// Demo data
const DEMO_USER = {
  email: 'demo@yourpos.com',
  password: 'demo123',
  name: 'Demo User',
  businessName: 'Demo Store'
}

const DEMO_PRODUCTS = [
  {
    name: 'iPhone 15 Pro',
    price: 999,
    cost: 700,
    stock: 25,
    barcode: 'DEMO123456789',
    category: 'Electronics',
    description: 'Latest iPhone with Pro features',
    isActive: true
  },
  {
    name: 'Samsung Galaxy S24',
    price: 899,
    cost: 650,
    stock: 15,
    barcode: 'DEMO987654321',
    category: 'Electronics',
    description: 'Premium Android smartphone',
    isActive: true
  },
  {
    name: 'iPad Air',
    price: 599,
    cost: 450,
    stock: 10,
    barcode: 'DEMO456789123',
    category: 'Electronics',
    description: 'Versatile tablet for work and play',
    isActive: true
  },
  {
    name: 'MacBook Air',
    price: 1299,
    cost: 950,
    stock: 5,
    barcode: 'DEMO789123456',
    category: 'Electronics',
    description: 'Lightweight laptop with M2 chip',
    isActive: true
  },
  {
    name: 'AirPods Pro',
    price: 249,
    cost: 150,
    stock: 30,
    barcode: 'DEMO111222333',
    category: 'Electronics',
    description: 'Wireless earbuds with noise cancellation',
    isActive: true
  },
  {
    name: 'Phone Case',
    price: 29,
    cost: 12,
    stock: 50,
    barcode: 'DEMO444555666',
    category: 'Accessories',
    description: 'Protective phone case',
    isActive: true
  }
]

const DEFAULT_SETTINGS = {
  storeName: 'Your Store',
  storeAddress: '123 Main St, City, State 12345',
  storePhone: '+1 (555) 123-4567',
  storeEmail: 'info@yourstore.com',
  taxRate: 8.25,
  currency: 'USD',
  receiptFooter: 'Thank you for your business!',
  lowStockThreshold: 10,
  autoBackup: true,
  printerSettings: {
    receiptPrinter: 'Default Receipt Printer',
    labelPrinter: 'Default Label Printer'
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true })

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, min: 0, default: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  barcode: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'General' },
  description: { type: String, trim: true },
  images: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

// Store Settings Schema
const storeSettingsSchema = new mongoose.Schema({
  storeName: { type: String, required: true, trim: true },
  storeAddress: { type: String, required: true, trim: true },
  storePhone: { type: String, required: true, trim: true },
  storeEmail: { type: String, required: true, trim: true, lowercase: true },
  taxRate: { type: Number, required: true, min: 0, max: 100, default: 8.25 },
  currency: { type: String, required: true, enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'], default: 'USD' },
  receiptFooter: { type: String, trim: true, default: 'Thank you for your business!' },
  lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
  autoBackup: { type: Boolean, default: true },
  printerSettings: {
    receiptPrinter: { type: String, trim: true, default: 'Default Receipt Printer' },
    labelPrinter: { type: String, trim: true, default: 'Default Label Printer' }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true })

// Counter Schema
const counterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  receiptNumber: { type: Number, required: true, min: 1, default: 1 },
  ticketNumber: { type: Number, required: true, min: 1, default: 1 },
  productId: { type: Number, required: true, min: 1, default: 1 },
  customerId: { type: Number, required: true, min: 1, default: 1 }
}, { timestamps: true })

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
const StoreSettings = mongoose.models.StoreSettings || mongoose.model('StoreSettings', storeSettingsSchema)
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing demo data...')
    const existingUser = await User.findOne({ email: DEMO_USER.email })
    if (existingUser) {
      await Product.deleteMany({ userId: existingUser._id })
      await StoreSettings.deleteOne({ userId: existingUser._id })
      await Counter.deleteOne({ userId: existingUser._id })
      await User.deleteOne({ email: DEMO_USER.email })
    }
    
    // Create demo user
    console.log('👤 Creating demo user...')
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12)
    
    const demoUser = new User({
      email: DEMO_USER.email,
      password: hashedPassword,
      name: DEMO_USER.name,
      businessName: DEMO_USER.businessName
    })
    
    const savedUser = await demoUser.save()
    console.log(`✅ Demo user created: ${savedUser.email}`)

    // Create demo products
    console.log('📦 Creating demo products...')
    const productPromises = DEMO_PRODUCTS.map(product => {
      return new Product({
        ...product,
        userId: savedUser._id
      }).save()
    })
    
    const savedProducts = await Promise.all(productPromises)
    console.log(`✅ Created ${savedProducts.length} demo products`)

    // Create default settings
    console.log('⚙️ Creating default store settings...')
    const settings = new StoreSettings({
      ...DEFAULT_SETTINGS,
      userId: savedUser._id
    })
    
    await settings.save()
    console.log('✅ Default store settings created')

    // Create counter
    console.log('🔢 Creating counters...')
    const counter = new Counter({
      userId: savedUser._id,
      receiptNumber: 1,
      ticketNumber: 1,
      productId: 1,
      customerId: 1
    })
    
    await counter.save()
    console.log('✅ Counters created')

    console.log('🎉 Database seeding completed successfully!')
    console.log(`
📋 Demo Account Details:
   Email: ${DEMO_USER.email}
   Password: ${DEMO_USER.password}
   Products: ${savedProducts.length} items
   
🚀 You can now login to the dashboard with these credentials.
    `)
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error)
      process.exit(1)
    })
}

module.exports = { seedDatabase }
