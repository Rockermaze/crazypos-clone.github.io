import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'

// Apply the autoTable plugin to jsPDF
applyPlugin(jsPDF)

/**
 * Generate sales invoice PDF
 * @param {Object} invoiceData - Invoice data
 * @param {Object} invoiceData.sale - Sale object with items, totals, etc.
 * @param {Object} invoiceData.storeSettings - Store settings with name, address, etc.
 * @param {Object} invoiceData.customerInfo - Customer information (optional)
 * @returns {Buffer} - PDF buffer
 */
export function generateSalesInvoicePDF({ sale, storeSettings, customerInfo }) {
  const doc = new jsPDF()
  
  // Colors
  const primaryColor = [79, 70, 229] // Indigo
  const secondaryColor = [107, 114, 128] // Gray
  const lightGray = [243, 244, 246]
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  
  let yPos = margin
  
  // Header - Store Information
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text(storeSettings.storeName || 'YourPOS Store', margin, yPos + 15)
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(storeSettings.storeAddress || '', margin, yPos + 25)
  doc.text(`Phone: ${storeSettings.storePhone || 'N/A'}`, margin, yPos + 32)
  doc.text(`Email: ${storeSettings.storeEmail || 'N/A'}`, margin, yPos + 39)
  
  // Invoice Title
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('INVOICE', pageWidth - margin, yPos + 20, { align: 'right' })
  
  yPos = 60
  
  // Invoice Details Box
  const invoiceBoxX = pageWidth - margin - 70
  doc.setFillColor(...lightGray)
  doc.rect(invoiceBoxX, yPos, 70, 30, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Receipt #:', invoiceBoxX + 5, yPos + 8)
  doc.text('Date:', invoiceBoxX + 5, yPos + 16)
  doc.text('Payment:', invoiceBoxX + 5, yPos + 24)
  
  doc.setFont(undefined, 'normal')
  doc.text(sale.receiptNumber || 'N/A', invoiceBoxX + 30, yPos + 8)
  doc.text(
    new Date(sale.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    invoiceBoxX + 30,
    yPos + 16
  )
  doc.text(sale.paymentMethod || 'CASH', invoiceBoxX + 30, yPos + 24)
  
  // Customer Information (if available)
  if (customerInfo && (customerInfo.name || customerInfo.phone)) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(12)
    doc.text('Bill To:', margin, yPos + 8)
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    if (customerInfo.name) {
      doc.text(customerInfo.name, margin, yPos + 16)
    }
    if (customerInfo.phone) {
      doc.text(`Phone: ${customerInfo.phone}`, margin, yPos + 22)
    }
    if (customerInfo.email) {
      doc.text(`Email: ${customerInfo.email}`, margin, yPos + 28)
    }
  }
  
  yPos += 45
  
  // Items Table
  const tableData = sale.items.map((item, index) => [
    index + 1,
    item.productName,
    item.quantity,
    `${storeSettings.currency || 'USD'} ${item.unitPrice.toFixed(2)}`,
    item.discount ? `${storeSettings.currency || 'USD'} ${item.discount.toFixed(2)}` : '-',
    `${storeSettings.currency || 'USD'} ${item.totalPrice.toFixed(2)}`,
  ])
  
  doc.autoTable({
    startY: yPos,
    head: [['#', 'Item', 'Qty', 'Unit Price', 'Discount', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })
  
  yPos = doc.lastAutoTable.finalY + 10
  
  // Totals Section
  const totalsX = pageWidth - margin - 70
  const totalsWidth = 70
  
  doc.setFillColor(...lightGray)
  doc.rect(totalsX, yPos, totalsWidth, 40, 'F')
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const currency = storeSettings.currency || 'USD'
  
  // Subtotal
  doc.text('Subtotal:', totalsX + 5, yPos + 8)
  doc.text(`${currency} ${sale.subtotal.toFixed(2)}`, totalsX + totalsWidth - 5, yPos + 8, {
    align: 'right',
  })
  
  // Tax
  doc.text(`Tax (${storeSettings.taxRate || 0}%):`, totalsX + 5, yPos + 16)
  doc.text(`${currency} ${sale.tax.toFixed(2)}`, totalsX + totalsWidth - 5, yPos + 16, {
    align: 'right',
  })
  
  // Discount
  if (sale.discount > 0) {
    doc.text('Discount:', totalsX + 5, yPos + 24)
    doc.text(`-${currency} ${sale.discount.toFixed(2)}`, totalsX + totalsWidth - 5, yPos + 24, {
      align: 'right',
    })
  }
  
  // Total
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  const totalY = sale.discount > 0 ? yPos + 34 : yPos + 26
  doc.text('TOTAL:', totalsX + 5, totalY)
  doc.text(`${currency} ${sale.total.toFixed(2)}`, totalsX + totalsWidth - 5, totalY, {
    align: 'right',
  })
  
  // Footer
  yPos = pageHeight - 30
  
  doc.setDrawColor(...secondaryColor)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  
  doc.setTextColor(...secondaryColor)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  
  yPos += 7
  const footerText = storeSettings.receiptFooter || 'Thank you for your business!'
  doc.text(footerText, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 5
  doc.setFontSize(8)
  doc.text(
    `Generated on ${new Date().toLocaleString('en-US')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}
