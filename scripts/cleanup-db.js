// Script to clean up MongoDB collections and indexes
// Run with: node scripts/cleanup-db.js

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

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...')
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log('✅ Connected to MongoDB')

    // Get the database
    const db = mongoose.connection.db
    
    // Get all collections
    const collections = await db.listCollections().toArray()
    console.log(`📋 Found ${collections.length} collections`)
    
    if (collections.length > 0) {
      for (const collection of collections) {
        console.log(`🗑️ Dropping collection: ${collection.name}`)
        try {
          await db.collection(collection.name).drop()
          console.log(`✅ Dropped collection: ${collection.name}`)
        } catch (error) {
          if (error.message.includes('ns not found')) {
            console.log(`⚠️ Collection ${collection.name} already doesn't exist`)
          } else {
            console.error(`❌ Error dropping ${collection.name}:`, error.message)
          }
        }
      }
    } else {
      console.log('No collections found to drop')
    }

    console.log('🎉 Database cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Error cleaning database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

cleanupDatabase()
