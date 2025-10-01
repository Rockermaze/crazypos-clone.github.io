// Test file to verify JavaScript modules work
console.log('Testing JavaScript module system...')

// Test MongoDB connection
import connectDB from './lib/mongodb.js'

// Test a model
import User from './models/User.js'

console.log('✅ All JavaScript modules loaded successfully!')

export default function test() {
  console.log('✅ JavaScript backend is working!')
  return 'Success!'
}
