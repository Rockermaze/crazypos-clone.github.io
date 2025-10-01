// Script to verify MongoDB connection and list all users
// Run with: node scripts/verify-db.js

const mongoose = require('mongoose')

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

// User schema
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

const User = mongoose.model('User', userSchema)

async function verifyDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...')
    console.log('URI:', MONGODB_URI.replace(/:[^:@]*@/, ':****@')) // Hide password in log
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log('✅ Connected to MongoDB Atlas successfully!')

    // Get database and collection info
    const db = mongoose.connection.db
    console.log('📊 Database name:', db.databaseName)

    // List all collections
    const collections = await db.listCollections().toArray()
    console.log('📦 Collections in database:')
    collections.forEach(col => console.log(`  - ${col.name}`))

    // Count users
    const userCount = await User.countDocuments()
    console.log(`👥 Total users in collection: ${userCount}`)

    // List all users (without passwords)
    console.log('\n📋 All users in database:')
    const users = await User.find({}).select('-password')
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Business: ${user.businessName}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   Updated: ${user.updatedAt}`)
    })

    // Test authentication with demo user
    console.log('\n🔐 Testing demo user authentication...')
    const demoUser = await User.findOne({ email: 'demo@yourpos.com' })
    if (demoUser) {
      const isValidPassword = await bcrypt.compare('demo123', demoUser.password)
      console.log(`   Demo user found: ✅`)
      console.log(`   Password 'demo123' is valid: ${isValidPassword ? '✅' : '❌'}`)
    } else {
      console.log('   Demo user not found: ❌')
    }

  } catch (error) {
    console.error('❌ Error verifying database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

verifyDatabase()
