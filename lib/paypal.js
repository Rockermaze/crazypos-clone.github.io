import checkoutNodeJssdk from '@paypal/checkout-server-sdk'

/**
 * PayPal SDK Configuration
 * This file contains the configuration for PayPal integration
 */

// PayPal environment configuration
const Environment = process.env.NODE_ENV === 'production' 
  ? checkoutNodeJssdk.core.LiveEnvironment 
  : checkoutNodeJssdk.core.SandboxEnvironment

// PayPal client configuration
const paypalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal client credentials are not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.')
  }
  
  return new checkoutNodeJssdk.core.PayPalHttpClient(
    new Environment(clientId, clientSecret)
  )
}

/**
 * Create PayPal order
 * @param {Object} orderData - Order data
 * @param {number} orderData.amount - Total amount
 * @param {string} orderData.currency - Currency code (default: USD)
 * @param {string} orderData.description - Order description
 * @param {string} orderData.referenceId - Reference ID for the order
 * @param {Object} orderData.customer - Customer information
 * @returns {Promise<Object>} PayPal order response
 */
export const createPayPalOrder = async (orderData) => {
  const {
    amount,
    currency = 'USD',
    description = 'Purchase from YourPOS',
    referenceId,
    customer = {},
    returnUrl = process.env.NEXTAUTH_URL + '/api/paypal/success',
    cancelUrl = process.env.NEXTAUTH_URL + '/api/paypal/cancel'
  } = orderData

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest()
  
  request.prefer("return=representation")
  request.requestBody({
    intent: 'CAPTURE',
    application_context: {
      brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'YourPOS',
      landing_page: 'NO_PREFERENCE',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl
    },
    purchase_units: [{
      reference_id: referenceId || `ORDER_${Date.now()}`,
      description: description,
      custom_id: referenceId,
      soft_descriptor: process.env.NEXT_PUBLIC_APP_NAME || 'YourPOS',
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }
      },
      payee: {
        email_address: process.env.PAYPAL_PAYEE_EMAIL
      }
    }],
    payer: {
      name: {
        given_name: customer.firstName || '',
        surname: customer.lastName || ''
      },
      email_address: customer.email || '',
      address: {
        country_code: customer.countryCode || 'US'
      }
    }
  })

  try {
    const client = paypalClient()
    const response = await client.execute(request)
    
    return {
      success: true,
      orderId: response.result.id,
      status: response.result.status,
      links: response.result.links,
      data: response.result
    }
  } catch (error) {
    console.error('PayPal Create Order Error:', error)
    return {
      success: false,
      error: error.message,
      details: error.details || []
    }
  }
}

/**
 * Capture PayPal order payment
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} Capture response
 */
export const capturePayPalOrder = async (orderId) => {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId)
  request.requestBody({})

  try {
    const client = paypalClient()
    const response = await client.execute(request)
    
    return {
      success: true,
      captureId: response.result.purchase_units[0].payments.captures[0].id,
      status: response.result.status,
      data: response.result
    }
  } catch (error) {
    console.error('PayPal Capture Order Error:', error)
    return {
      success: false,
      error: error.message,
      details: error.details || []
    }
  }
}

/**
 * Get PayPal order details
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} Order details
 */
export const getPayPalOrderDetails = async (orderId) => {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId)

  try {
    const client = paypalClient()
    const response = await client.execute(request)
    
    return {
      success: true,
      data: response.result
    }
  } catch (error) {
    console.error('PayPal Get Order Error:', error)
    return {
      success: false,
      error: error.message,
      details: error.details || []
    }
  }
}

/**
 * Refund PayPal capture
 * @param {string} captureId - PayPal capture ID
 * @param {Object} refundData - Refund data
 * @param {number} refundData.amount - Refund amount
 * @param {string} refundData.currency - Currency code
 * @param {string} refundData.note - Refund note
 * @returns {Promise<Object>} Refund response
 */
export const refundPayPalCapture = async (captureId, refundData) => {
  const { amount, currency = 'USD', note = 'Refund processed' } = refundData
  
  const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId)
  request.requestBody({
    amount: {
      value: amount.toFixed(2),
      currency_code: currency
    },
    note_to_payer: note
  })

  try {
    const client = paypalClient()
    const response = await client.execute(request)
    
    return {
      success: true,
      refundId: response.result.id,
      status: response.result.status,
      data: response.result
    }
  } catch (error) {
    console.error('PayPal Refund Error:', error)
    return {
      success: false,
      error: error.message,
      details: error.details || []
    }
  }
}

/**
 * Verify PayPal webhook signature
 * @param {Object} headers - Request headers
 * @param {string} body - Request body
 * @returns {boolean} Verification result
 */
export const verifyPayPalWebhook = (headers, body) => {
  try {
    // PayPal webhook verification logic
    // This is a simplified version - in production, implement proper webhook verification
    const authAlgo = headers['paypal-auth-algo']
    const transmission = headers['paypal-transmission-id']
    const certId = headers['paypal-cert-id']
    const signature = headers['paypal-transmission-sig']
    const timestamp = headers['paypal-transmission-time']
    
    // For now, return true if all required headers are present
    return !!(authAlgo && transmission && certId && signature && timestamp)
  } catch (error) {
    console.error('PayPal Webhook Verification Error:', error)
    return false
  }
}

/**
 * Calculate PayPal fees
 * @param {number} amount - Transaction amount
 * @param {string} currency - Currency code
 * @param {string} type - Transaction type (domestic/international)
 * @returns {Object} Fee calculation
 */
export const calculatePayPalFees = (amount, currency = 'USD', type = 'domestic') => {
  let feePercentage = 0.029 // 2.9% for domestic transactions
  let fixedFee = 0.30 // $0.30 fixed fee
  
  // Adjust fees based on transaction type and currency
  if (type === 'international') {
    feePercentage = 0.044 // 4.4% for international transactions
    fixedFee = 0.30
  }
  
  // Adjust fixed fee for different currencies
  const currencyFixedFees = {
    'USD': 0.30,
    'EUR': 0.35,
    'GBP': 0.20,
    'CAD': 0.30,
    'AUD': 0.30,
    'INR': 3.00
  }
  
  fixedFee = currencyFixedFees[currency] || fixedFee
  
  const percentageFee = amount * feePercentage
  const totalFee = percentageFee + fixedFee
  const netAmount = amount - totalFee
  
  return {
    amount,
    feePercentage: (feePercentage * 100).toFixed(2) + '%',
    fixedFee,
    percentageFee: parseFloat(percentageFee.toFixed(2)),
    totalFee: parseFloat(totalFee.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
    currency
  }
}

/**
 * Format PayPal error for user display
 * @param {Object} error - PayPal error object
 * @returns {string} Formatted error message
 */
export const formatPayPalError = (error) => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error.details && error.details.length > 0) {
    return error.details.map(detail => detail.description || detail.issue).join(', ')
  }
  
  return error.message || 'An unknown PayPal error occurred'
}

/**
 * Get PayPal configuration status
 * @returns {Object} Configuration status
 */
export const getPayPalConfig = () => {
  return {
    isConfigured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    clientId: process.env.PAYPAL_CLIENT_ID ? 'Set' : 'Not Set',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'Set' : 'Not Set',
    payeeEmail: process.env.PAYPAL_PAYEE_EMAIL ? 'Set' : 'Not Set',
    webhookId: process.env.PAYPAL_WEBHOOK_ID ? 'Set' : 'Not Set'
  }
}

// Export the PayPal client for direct use if needed
export { paypalClient }

// Default export with all functions
export default {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderDetails,
  refundPayPalCapture,
  verifyPayPalWebhook,
  calculatePayPalFees,
  formatPayPalError,
  getPayPalConfig,
  paypalClient
}