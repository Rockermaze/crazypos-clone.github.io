import Stripe from 'stripe'

let stripeInstance = null

export function getStripe() {
  if (stripeInstance) return stripeInstance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }
  stripeInstance = new Stripe(key, {
    apiVersion: '2023-10-16',
    typescript: false,
  })
  return stripeInstance
}

// Stripe Connect configuration
export const STRIPE_CONNECT_CONFIG = {
  // For development, use relaxed requirements
  requirements: {
    business_type: 'individual', // Start with individual accounts for easier testing
    business_profile: {
      mcc: '5734', // Computer Software Stores
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    }
  },
  // Platform fee percentage (you can adjust this)
  platformFeePercentage: 1.5, // 1.5% platform fee
  // Currency settings
  defaultCurrency: 'usd',
  supportedCurrencies: ['usd', 'eur', 'gbp', 'inr', 'cad', 'aud'],
}

// Helper function to create connected account
export async function createConnectedAccount(userData) {
  try {
    const account = await getStripe().accounts.create({
      type: 'express', // Use Express accounts for easier onboarding
      country: userData.country || 'US', // Default to US for development
      email: userData.email,
      business_type: 'individual', // Start with individual for easier testing
      individual: {
        first_name: userData.firstName || userData.name?.split(' ')[0],
        last_name: userData.lastName || userData.name?.split(' ')[1] || 'User',
        email: userData.email,
      },
      business_profile: {
        name: userData.businessName,
        mcc: '5734', // Computer Software Stores
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily', // For development - can be changed to weekly/monthly
          }
        }
      }
    })
    
    return account
  } catch (error) {
    console.error('Error creating connected account:', error)
    throw error
  }
}

// Helper function to create account link for onboarding
export async function createAccountLink(accountId, refreshUrl, returnUrl) {
  try {
    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    
    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

// Helper function to create payment intent with platform fee
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  connectedAccountId,
  platformFeeAmount,
  customerEmail,
  description,
  metadata = {}
}) {
  try {
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer_email: customerEmail,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    }

    // If this is a connected account payment, add platform fee
    if (connectedAccountId && platformFeeAmount) {
      paymentIntentData.transfer_data = {
        destination: connectedAccountId,
      }
      paymentIntentData.application_fee_amount = Math.round(platformFeeAmount * 100)
    }

    const paymentIntent = await getStripe().paymentIntents.create(paymentIntentData)
    
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Helper function to retrieve account details
export async function getAccountDetails(accountId) {
  try {
    const account = await getStripe().accounts.retrieve(accountId)
    return account
  } catch (error) {
    console.error('Error retrieving account:', error)
    throw error
  }
}

// Helper function to check if account can accept payments
export function canAcceptPayments(account) {
  return account.charges_enabled && account.payouts_enabled
}

// Helper function to calculate platform fee
export function calculatePlatformFee(amount, feePercentage = STRIPE_CONNECT_CONFIG.platformFeePercentage) {
  return (amount * feePercentage) / 100
}

export default getStripe
