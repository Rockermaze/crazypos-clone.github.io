import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import Counter from '@/models/Counter'
import Transaction from '@/models/Transaction'
import Customer from '@/models/Customer'
import StoreSettings from '@/models/StoreSettings'
import { generateSalesInvoicePDF } from '@/lib/pdf/generateSalesInvoice'
import { sendSalesInvoiceEmail } from '@/lib/email'
import { validateEmail, validateEmailConfig } from '@/lib/emailValidator'

// GET /api/sales - Get all sales for authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethod = searchParams.get('paymentMethod')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = { userId: session.user.id }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod
    }

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Convert MongoDB ObjectIds to strings
    const serializedSales = sales.map(sale => ({
      ...sale,
      id: sale._id.toString(),
      _id: undefined,
      userId: undefined,
      cashierId: undefined
    }))

    return NextResponse.json({ sales: serializedSales })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Create new sale
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const body = await request.json()
  const {
    items,
    subtotal,
    tax,
    discount = 0,
    total,
    paymentMethod,
    paymentGateway,
    customerInfo,
    customerId,
    stripeData
  } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale must have at least one item' },
        { status: 400 }
      )
    }

    if (!paymentMethod || !total || !subtotal) {
      return NextResponse.json(
        { error: 'Payment method, total, and subtotal are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Generate receipt number using Counter.getNextSequence
    const receiptCounter = await Counter.getNextSequence('receipt', session.user.id)
    const receiptNumber = `REC-${receiptCounter.toString().padStart(5, '0')}`

    // Validate and update product stock
    for (const item of items) {
      const product = await Product.findOne({ 
        _id: item.productId, 
        userId: session.user.id 
      })
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productName} not found` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}` },
          { status: 400 }
        )
      }

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    // Handle customer linkage
    let linkedCustomerId = customerId
    
    // If customer info provided but no customerId, try to find or create customer
    if (!linkedCustomerId && customerInfo && (customerInfo.phone || customerInfo.email)) {
      const contact = customerInfo.phone || customerInfo.email
      let customer = await Customer.findByContact(session.user.id, contact)
      
      // Create new customer if not found and phone is provided
      if (!customer && customerInfo.phone && customerInfo.name) {
        customer = new Customer({
          userId: session.user.id,
          name: customerInfo.name,
          email: customerInfo.email || undefined,
          phone: customerInfo.phone
        })
        await customer.save()
      }
      
      if (customer) {
        linkedCustomerId = customer._id
      }
    }

    // Create new sale
    const newSale = new Sale({
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0
      })),
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax || 0),
      discount: parseFloat(discount),
      total: parseFloat(total),
      paymentMethod,
      paymentGateway: paymentGateway || (paymentMethod === 'STRIPE' ? 'STRIPE' : 'MANUAL'),
      paymentStatus: paymentMethod === 'STRIPE' ? 'COMPLETED' : 'COMPLETED',
      externalTransactionId: stripeData?.paymentIntentId || null,
      customerId: linkedCustomerId,
      customerInfo,
      receiptNumber,
      cashierId: session.user.id,
      userId: session.user.id
    })

    const savedSale = await newSale.save()

    // Update customer purchase history if linked
    if (linkedCustomerId) {
      try {
        const customer = await Customer.findById(linkedCustomerId)
        if (customer) {
          await customer.addPurchase(savedSale._id, savedSale.total, savedSale.receiptNumber)
        }
      } catch (custErr) {
        console.error('Warning: Failed to update customer purchase history:', custErr)
        // Don't fail the sale if customer update fails
      }
    }

    // Create corresponding Transaction record for all payment methods
    try {
      const method = String(savedSale.paymentMethod || '').toUpperCase()
      
      // Handle Stripe payments
      if (method === 'STRIPE' && stripeData?.paymentIntentId) {
        // Find existing transaction created by Stripe webhook
        const existingTransaction = await Transaction.findOne({ 
          stripePaymentIntentId: stripeData.paymentIntentId 
        })
        
        if (existingTransaction) {
          // Update existing transaction with sale reference
          existingTransaction.saleId = savedSale._id
          existingTransaction.description = `Sale ${savedSale.receiptNumber} - Stripe payment`
          existingTransaction.metadata = {
            ...existingTransaction.metadata,
            receiptNumber: savedSale.receiptNumber,
            source: 'sales-api'
          }
          await existingTransaction.save()
          
          // Link sale to transaction
          savedSale.transactionId = existingTransaction._id
          await savedSale.save()
        } else {
          // Create new transaction for Stripe payment if webhook hasn't created one yet
          const txnId = Transaction.generateTransactionId()
          const description = `Sale ${savedSale.receiptNumber} - Stripe payment`

          // For Stripe payments created here, calculate platform fee
          const platformFeeAmount = stripeData.platformFee || 0
          const netAmount = savedSale.total - platformFeeAmount
          
          const transaction = new Transaction({
            transactionId: txnId,
            userId: session.user.id,
            saleId: savedSale._id,
            amount: savedSale.total,
            currency: savedSale.currency || 'USD',
            type: 'SALE',
            status: 'COMPLETED',
            paymentMethod: 'STRIPE',
            paymentGateway: 'STRIPE',
            stripePaymentIntentId: stripeData.paymentIntentId,
            applicationFeeAmount: platformFeeAmount,
            description,
            fee: { amount: platformFeeAmount, currency: savedSale.currency || 'USD', type: 'PROCESSING_FEE' },
            netAmount,
            customer: savedSale.customerInfo ? {
              name: savedSale.customerInfo.name,
              email: savedSale.customerInfo.email,
              phone: savedSale.customerInfo.phone
            } : {},
            metadata: {
              source: 'sales-api',
              receiptNumber: savedSale.receiptNumber,
              paymentIntentId: stripeData.paymentIntentId
            },
            processedAt: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent')
          })

          const savedTxn = await transaction.save()
          
          // Update sale with transaction reference
          savedSale.transactionId = savedTxn._id
          await savedSale.save()
        }
      }
      // Handle manual payments
      else {
        const manualMethods = new Set(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE', 'STORE_CREDIT'])

        if (manualMethods.has(method)) {
          const txnId = Transaction.generateTransactionId()
          const description = `Sale ${savedSale.receiptNumber} - ${method} payment`
          
          // Calculate fees based on payment method
          let feeAmount = 0
          let feeType = 'TRANSACTION_FEE'
          
          // Apply standard fees for card payments (2.9% + $0.30)
          if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
            feeAmount = (savedSale.total * 0.029) + 0.30
            feeType = 'PROCESSING_FEE'
          }
          // Online payments might have different fees (example: 3.5%)
          else if (method === 'ONLINE') {
            feeAmount = savedSale.total * 0.035
            feeType = 'GATEWAY_FEE'
          }
          // CASH and STORE_CREDIT have no fees
          
          const netAmount = savedSale.total - feeAmount

          const transaction = new Transaction({
            transactionId: txnId,
            userId: session.user.id,
            saleId: savedSale._id,
            amount: savedSale.total,
            currency: savedSale.currency || 'USD',
            type: 'SALE',
            status: 'COMPLETED',
            paymentMethod: method,
            paymentGateway: 'MANUAL',
            description,
            notes: `Manual ${method} payment recorded for receipt ${savedSale.receiptNumber}`,
            fee: { amount: feeAmount, currency: savedSale.currency || 'USD', type: feeType },
            netAmount,
            customer: savedSale.customerInfo ? {
              name: savedSale.customerInfo.name,
              email: savedSale.customerInfo.email,
              phone: savedSale.customerInfo.phone
            } : {},
            metadata: {
              source: 'sales-api',
              receiptNumber: savedSale.receiptNumber
            },
            processedAt: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent')
          })

          const savedTxn = await transaction.save()

          // Update sale with gateway and transaction reference
          savedSale.paymentGateway = 'MANUAL'
          savedSale.transactionId = savedTxn._id
          if (savedSale.paymentStatus !== 'COMPLETED') {
            savedSale.paymentStatus = 'COMPLETED'
          }
          await savedSale.save()
        }
      }
    } catch (txnErr) {
      console.error('Warning: Failed to create manual transaction for sale:', txnErr)
      // Do not fail the sale creation if transaction creation fails
    }

    // Send invoice email if customer email is provided
    let emailStatus = null
    if (customerInfo?.email) {
      try {
        console.log('📧 Starting email process for customer:', customerInfo.email)
        
        // Validate customer email
        const customerEmailValidation = validateEmail(customerInfo.email)
        if (!customerEmailValidation.isValid) {
          emailStatus = {
            sent: false,
            error: `Customer email invalid: ${customerEmailValidation.error}`
          }
          console.error('❌ Customer email validation failed:', customerEmailValidation.error)
        } else {
          console.log('✅ Customer email validated:', customerEmailValidation.email)
          
          // Check email configuration
          const emailConfigCheck = validateEmailConfig()
          if (!emailConfigCheck.isConfigured) {
            emailStatus = {
              sent: false,
              error: `Email not configured: ${emailConfigCheck.error}`
            }
            console.error('❌ Email configuration check failed:', emailConfigCheck.error)
          } else {
            console.log('✅ Email configuration validated')
            
            // Fetch store settings
            const storeSettings = await StoreSettings.findOne({ userId: session.user.id })
            
            if (!storeSettings) {
              emailStatus = {
                sent: false,
                error: 'Store settings not found. Please configure your store in Settings.'
              }
              console.error('❌ Store settings not found for user:', session.user.id)
            } else if (!storeSettings.storeEmail) {
              emailStatus = {
                sent: false,
                error: 'Store email not configured. Please set your store email in Settings.'
              }
              console.error('❌ Store email not set in store settings')
            } else {
              console.log('✅ Store settings found, validating store email:', storeSettings.storeEmail)
              
              // Validate store email
              const storeEmailValidation = validateEmail(storeSettings.storeEmail)
              if (!storeEmailValidation.isValid) {
                emailStatus = {
                  sent: false,
                  error: `Store email invalid: ${storeEmailValidation.error}. Please update in Settings.`
                }
                console.error('❌ Store email validation failed:', storeEmailValidation.error)
              } else {
                console.log('✅ Store email validated:', storeEmailValidation.email)
                console.log('📄 Generating invoice PDF...')
                
                // All validations passed, send email
                // Generate PDF
                const pdfBuffer = generateSalesInvoicePDF({
                  sale: savedSale,
                  storeSettings,
                  customerInfo
                })
                
                console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes')
                console.log('📧 Sending email to:', customerEmailValidation.email)
                
                // Send email
                const emailResult = await sendSalesInvoiceEmail({
                  to: customerEmailValidation.email,
                  customerName: customerInfo.name,
                  receiptNumber: savedSale.receiptNumber,
                  pdfBuffer,
                  storeName: storeSettings.storeName,
                  storeEmail: storeEmailValidation.email
                })
                
                if (emailResult.success) {
                  emailStatus = {
                    sent: true,
                    message: `Invoice sent to ${customerEmailValidation.email}`
                  }
                  console.log('✅ Invoice email sent successfully to:', customerEmailValidation.email, 'MessageID:', emailResult.messageId)
                } else {
                  emailStatus = {
                    sent: false,
                    error: `Failed to send email: ${emailResult.error}`
                  }
                  console.error('❌ Failed to send invoice email. Error:', emailResult.error)
                }
              }
            }
          }
        }
      } catch (emailErr) {
        emailStatus = {
          sent: false,
          error: `Email error: ${emailErr.message || 'Unknown error'}`
        }
        console.error('❌ CRITICAL: Failed to send invoice email. Error details:')
        console.error('   Error message:', emailErr.message)
        console.error('   Error stack:', emailErr.stack)
        console.error('   Customer email:', customerInfo?.email)
        // Don't fail the sale if email sending fails
      }
    } else {
      console.log('ℹ️  No customer email provided, skipping invoice email')
    }

    // Convert to response format
    const responseSale = {
      id: savedSale._id.toString(),
      items: savedSale.items,
      subtotal: savedSale.subtotal,
      tax: savedSale.tax,
      discount: savedSale.discount,
      total: savedSale.total,
      paymentMethod: savedSale.paymentMethod,
      paymentStatus: savedSale.paymentStatus,
      customerInfo: savedSale.customerInfo,
      receiptNumber: savedSale.receiptNumber,
      createdAt: savedSale.createdAt,
      updatedAt: savedSale.updatedAt
    }

    return NextResponse.json(
      { 
        message: 'Sale recorded successfully', 
        sale: responseSale,
        emailStatus
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sale:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
