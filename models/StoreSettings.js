import mongoose from 'mongoose'

const printerSettingsSchema = new mongoose.Schema({
  receiptPrinter: {
    type: String,
    trim: true,
    maxlength: [200, 'Receipt printer name cannot be more than 200 characters'],
    default: 'Default Receipt Printer'
  },
  labelPrinter: {
    type: String,
    trim: true,
    maxlength: [200, 'Label printer name cannot be more than 200 characters'],
    default: 'Default Label Printer'
  }
}, { _id: false })

const storeSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [200, 'Store name cannot be more than 200 characters']
  },
  storeAddress: {
    type: String,
    required: [true, 'Store address is required'],
    trim: true,
    maxlength: [500, 'Store address cannot be more than 500 characters']
  },
  storePhone: {
    type: String,
    required: [true, 'Store phone is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  storeEmail: {
    type: String,
    required: [true, 'Store email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  taxRate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot be more than 100%'],
    default: 8.25
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
    default: 'USD'
  },
  receiptFooter: {
    type: String,
    trim: true,
    maxlength: [500, 'Receipt footer cannot be more than 500 characters'],
    default: 'Thank you for your business!'
  },
  lowStockThreshold: {
    type: Number,
    required: [true, 'Low stock threshold is required'],
    min: [0, 'Low stock threshold cannot be negative'],
    default: 10
  },
  autoBackup: {
    type: Boolean,
    default: true
  },
  printerSettings: {
    type: printerSettingsSchema,
    default: () => ({
      receiptPrinter: 'Default Receipt Printer',
      labelPrinter: 'Default Label Printer'
    })
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
})

// Create indexes for better performance
storeSettingsSchema.index({ userId: 1 }, { unique: true })

const StoreSettings = mongoose.models.StoreSettings || mongoose.model('StoreSettings', storeSettingsSchema)

export default StoreSettings
