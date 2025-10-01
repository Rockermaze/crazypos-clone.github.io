// Script to seed the database with demo user
// Run with: node scripts/seed-db.js

const mongoose = require('mongoose')
require('dotenv/config')

// Load environment variables from .env.local
const path = require('path')
const fs = require('fs')

const envLocalPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  const lines = envContent.split('\n')
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const equalIndex = line.indexOf('=')
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim()
        const value = line.substring(equalIndex + 1).trim()
        if (key && value && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in your .env.local file')
  process.exit(1)
}

// User schema (copy from models/User.js)
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

const User = mongoose.model('User', userSchema)

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log('✅ Connected to MongoDB')

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@yourpos.com' })
    
    if (existingUser) {
      console.log('Demo user already exists')
      return
    }

    // Create demo user
    console.log('Creating demo user...')
    const demoUser = new User({
      email: 'demo@yourpos.com',
      password: 'demo123',
      name: 'Demo User',
      businessName: 'Demo Store'
    })

    await demoUser.save()
    console.log('✅ Demo user created successfully')
    console.log('Email: demo@yourpos.com')
    console.log('Password: demo123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

seedDatabase()
