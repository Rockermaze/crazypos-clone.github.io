import * as nodemailer from 'nodemailer'

/**
 * Create email transporter using SMTP configuration
 */
function createTransporter() {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  }

  // Handle both CommonJS and ES module exports
  const mailer = nodemailer.default || nodemailer
  return mailer.createTransport(config)
}

/**
 * Send email with PDF attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {Buffer} options.pdfBuffer - PDF file buffer
 * @param {string} options.pdfFilename - PDF filename
 * @param {string} options.fromName - Sender name (optional, uses store name from settings)
 * @param {string} options.fromEmail - Sender email (optional, uses store email from settings)
 * @returns {Promise<Object>} - Email send result
 */
export async function sendEmailWithPDF({
  to,
  subject,
  html,
  pdfBuffer,
  pdfFilename,
  fromName,
  fromEmail,
}) {
  try {
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env.local')
    }

    const transporter = createTransporter()

    // Determine sender
    const senderName = fromName || process.env.EMAIL_FROM_NAME || 'YourPOS Store'
    const senderEmail = fromEmail || process.env.EMAIL_USER

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send sales invoice email
 * @param {Object} options - Invoice options
 * @param {string} options.to - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.receiptNumber - Receipt number
 * @param {Buffer} options.pdfBuffer - Invoice PDF buffer
 * @param {string} options.storeName - Store name
 * @param {string} options.storeEmail - Store email
 * @returns {Promise<Object>} - Email send result
 */
export async function sendSalesInvoiceEmail({
  to,
  customerName,
  receiptNumber,
  pdfBuffer,
  storeName,
  storeEmail,
}) {
  const subject = `Invoice ${receiptNumber} from ${storeName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Invoice from ${storeName}</h1>
          </div>
          <div class="content">
            <p>Dear ${customerName || 'Valued Customer'},</p>
            <p>Thank you for your purchase! Please find your invoice <strong>${receiptNumber}</strong> attached to this email.</p>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <p>Best regards,<br>${storeName}</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>Contact us at: ${storeEmail}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmailWithPDF({
    to,
    subject,
    html,
    pdfBuffer,
    pdfFilename: `Invoice-${receiptNumber}.pdf`,
    fromName: storeName,
    fromEmail: storeEmail,
  })
}

/**
 * Send repair ticket invoice email
 * @param {Object} options - Ticket options
 * @param {string} options.to - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.ticketNumber - Ticket number
 * @param {Buffer} options.pdfBuffer - Ticket PDF buffer
 * @param {string} options.storeName - Store name
 * @param {string} options.storeEmail - Store email
 * @returns {Promise<Object>} - Email send result
 */
export async function sendRepairTicketEmail({
  to,
  customerName,
  ticketNumber,
  pdfBuffer,
  storeName,
  storeEmail,
}) {
  const subject = `Repair Ticket ${ticketNumber} from ${storeName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Repair Ticket Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${customerName || 'Valued Customer'},</p>
            <p>Your repair ticket <strong>${ticketNumber}</strong> has been created successfully. Please find the ticket details attached to this email.</p>
            <div class="info-box">
              <strong>Important:</strong> Please keep this ticket number for reference when checking the status of your repair.
            </div>
            <p>We will notify you once your repair is complete and ready for pickup.</p>
            <p>If you have any questions, please contact us and provide your ticket number.</p>
            <p>Best regards,<br>${storeName}</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>Contact us at: ${storeEmail}</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmailWithPDF({
    to,
    subject,
    html,
    pdfBuffer,
    pdfFilename: `Repair-Ticket-${ticketNumber}.pdf`,
    fromName: storeName,
    fromEmail: storeEmail,
  })
}
