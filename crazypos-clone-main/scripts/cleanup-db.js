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
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log('✅ Connected to MongoDB')

    // Get the database
    const db = mongoose.connection.db
    
    // Check if users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray()
    
    if (collections.length > 0) {
      console.log('Users collection exists. Checking indexes...')
      
      // Get current indexes
      const indexes = await db.collection('users').indexes()
      console.log('Current indexes:', indexes.map(idx => idx.name))
      
      // Drop the users collection completely to start fresh
      console.log('Dropping users collection to start fresh...')
      await db.collection('users').drop()
      console.log('✅ Users collection dropped')
    } else {
      console.log('Users collection does not exist yet')
    }

  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('Collection already doesn\'t exist, continuing...')
    } else {
      console.error('❌ Error cleaning database:', error)
    }
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

cleanupDatabase()
