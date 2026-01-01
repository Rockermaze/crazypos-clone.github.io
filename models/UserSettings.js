import mongoose from 'mongoose'

// Company Information Schema
const companyInformationSchema = new mongoose.Schema({
  businessName: { type: String, trim: true },
  businessType: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  website: { type: String, trim: true },
  taxId: { type: String, trim: true }
}, { _id: false })

// Store Information Schema
const storeInformationSchema = new mongoose.Schema({
  storeName: { type: String, trim: true },
  storeCode: { type: String, trim: true },
  timezone: { type: String, default: 'America/New_York' },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  receiptHeader: { type: String, trim: true, default: 'Thank you for your purchase!' },
  receiptFooter: { type: String, trim: true, default: 'Please visit us again' },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  enableInventoryTracking: { type: Boolean, default: true },
  enableMultiLocation: { type: Boolean, default: false }
}, { _id: false })

// Email Settings Schema
const emailSettingsSchema = new mongoose.Schema({
  provider: { 
    type: String, 
    enum: ['gmail', 'smtp', 'sendgrid', 'none'],
    default: 'none'
  },
  smtpHost: { type: String, trim: true },
  smtpPort: { type: Number, default: 587 },
  smtpUsername: { type: String, trim: true },
  smtpPassword: { type: String }, // Should be encrypted in production
  smtpSecure: { type: Boolean, default: false },
  fromEmail: { type: String, trim: true, lowercase: true },
  fromName: { type: String, trim: true },
  enableReceiptEmails: { type: Boolean, default: true },
  enableOrderNotifications: { type: Boolean, default: true },
  enableLowStockAlerts: { type: Boolean, default: false },
  gmailAccessToken: { type: String }, // For OAuth
  gmailRefreshToken: { type: String }, // For OAuth
  sendgridApiKey: { type: String } // For SendGrid
}, { _id: false })

// Printing Settings Schema
const printingSettingsSchema = new mongoose.Schema({
  receiptPrinter: { type: String, default: 'default' },
  labelPrinter: { type: String, default: 'none' },
  paperSize: { 
    type: String, 
    enum: ['58mm', '80mm', 'A4'],
    default: '80mm'
  },
  enableAutoPrint: { type: Boolean, default: false },
  printCopies: { type: Number, default: 1, min: 1, max: 5 },
  showPrices: { type: Boolean, default: true },
  showBarcode: { type: Boolean, default: true },
  showLogo: { type: Boolean, default: true }
}, { _id: false })

// Payment Settings Schema
const paymentSettingsSchema = new mongoose.Schema({
  stripeConnectId: { type: String, trim: true },
  enableCreditCard: { type: Boolean, default: true },
  enableDebitCard: { type: Boolean, default: true },
  enableDigitalWallets: { type: Boolean, default: true },
  enableBankTransfer: { type: Boolean, default: false },
  enableCash: { type: Boolean, default: true },
  platformFeePercentage: { type: Number, default: 1.5, min: 0, max: 10 },
  currency: { type: String, default: 'AUD' },
  acceptTerms: { type: Boolean, default: false }
}, { _id: false })

// Main User Settings Schema
const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  companyInformation: {
    type: companyInformationSchema,
    default: () => ({})
  },
  storeInformation: {
    type: storeInformationSchema,
    default: () => ({})
  },
  emailSettings: {
    type: emailSettingsSchema,
    default: () => ({})
  },
  printingSettings: {
    type: printingSettingsSchema,
    default: () => ({})
  },
  paymentSettings: {
    type: paymentSettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true
})

// Create index for efficient lookups
userSettingsSchema.index({ userId: 1 })

// Method to get all settings for a user
userSettingsSchema.methods.getAllSettings = function() {
  return {
    companyInformation: this.companyInformation,
    storeInformation: this.storeInformation,
    emailSettings: this.emailSettings,
    printingSettings: this.printingSettings,
    paymentSettings: this.paymentSettings
  }
}

// Static method to get or create settings for a user
userSettingsSchema.statics.getOrCreate = async function(userId) {
  let settings = await this.findOne({ userId })
  
  if (!settings) {
    settings = await this.create({
      userId,
      companyInformation: {},
      storeInformation: {},
      emailSettings: {},
      printingSettings: {},
      paymentSettings: {}
    })
  }
  
  return settings
}

const UserSettings = mongoose.models.UserSettings || mongoose.model('UserSettings', userSettingsSchema)

export default UserSettings
