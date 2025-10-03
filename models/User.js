import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

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
  },
  // Stripe Connect integration fields
  stripeAccountId: {
    type: String,
    sparse: true, // Allow multiple null values but unique non-null values
    index: true
  },
  stripeAccountStatus: {
    type: String,
    enum: ['not_created', 'pending', 'active', 'restricted', 'rejected'],
    default: 'not_created',
    index: true
  },
  stripeChargesEnabled: {
    type: Boolean,
    default: false
  },
  stripePayoutsEnabled: {
    type: Boolean,
    default: false
  },
  platformFeePercentage: {
    type: Number,
    min: [0, 'Platform fee cannot be negative'],
    max: [10, 'Platform fee cannot exceed 10%'],
    default: 1.5 // Default platform fee of 1.5%
  },
  // Business details for payments
  businessDetails: {
    country: {
      type: String,
      default: 'US'
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true
    },
    businessType: {
      type: String,
      enum: ['individual', 'company'],
      default: 'individual'
    },
    mcc: {
      type: String,
      default: '5734' // Computer Software Stores
    }
  },
  onboardingStatus: {
    companyInformation: {
      type: Boolean,
      default: false
    },
    storeInformation: {
      type: Boolean,
      default: false
    },
    supplierConnection: {
      type: Boolean,
      default: false
    },
    emailSettings: {
      type: Boolean,
      default: false
    },
    paymentSettings: {
      type: Boolean,
      default: false
    },
    printingSettings: {
      type: Boolean,
      default: false
    },
    addProduct: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    },
    skipped: {
      type: Boolean,
      default: false
    }
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

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
