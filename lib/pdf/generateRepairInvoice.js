import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'

// Apply the autoTable plugin to jsPDF
applyPlugin(jsPDF)

/**
 * Generate repair ticket invoice PDF
 * @param {Object} ticketData - Ticket data
 * @param {Object} ticketData.ticket - Repair ticket object
 * @param {Object} ticketData.storeSettings - Store settings with name, address, etc.
 * @returns {Buffer} - PDF buffer
 */
export function generateRepairInvoicePDF({ ticket, storeSettings }) {
  const doc = new jsPDF()
  
  // Colors
  const primaryColor = [5, 150, 105] // Green
  const secondaryColor = [107, 114, 128] // Gray
  const lightGray = [243, 244, 246]
  const warningColor = [245, 158, 11] // Amber
  
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
  
  // Ticket Title
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('REPAIR TICKET', pageWidth - margin, yPos + 20, { align: 'right' })
  
  yPos = 60
  
  // Ticket Details Box
  const ticketBoxX = pageWidth - margin - 70
  doc.setFillColor(...lightGray)
  doc.rect(ticketBoxX, yPos, 70, 38, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Ticket #:', ticketBoxX + 5, yPos + 8)
  doc.text('Date:', ticketBoxX + 5, yPos + 16)
  doc.text('Status:', ticketBoxX + 5, yPos + 24)
  doc.text('Priority:', ticketBoxX + 5, yPos + 32)
  
  doc.setFont(undefined, 'normal')
  doc.text(ticket.ticketNumber || 'N/A', ticketBoxX + 30, yPos + 8)
  doc.text(
    new Date(ticket.dateReceived).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    ticketBoxX + 30,
    yPos + 16
  )
  
  // Status with color
  const statusUpper = (ticket.status || 'pending').toUpperCase()
  doc.text(statusUpper, ticketBoxX + 30, yPos + 24)
  
  // Priority with color
  const priorityUpper = (ticket.priority || 'medium').toUpperCase()
  doc.text(priorityUpper, ticketBoxX + 30, yPos + 32)
  
  // Customer Information
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('Customer Information:', margin, yPos + 8)
  
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  const custInfo = ticket.customerInfo || {}
  doc.text(custInfo.name || 'N/A', margin, yPos + 16)
  doc.text(`Phone: ${custInfo.phone || 'N/A'}`, margin, yPos + 22)
  if (custInfo.email) {
    doc.text(`Email: ${custInfo.email}`, margin, yPos + 28)
  }
  
  yPos += 50
  
  // Device Information Section
  doc.setFillColor(...lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 45, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Device Information', margin + 5, yPos + 8)
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  const deviceInfo = ticket.deviceInfo || {}
  
  // Left column
  doc.text(`Brand: ${deviceInfo.brand || 'N/A'}`, margin + 5, yPos + 18)
  doc.text(`Model: ${deviceInfo.model || 'N/A'}`, margin + 5, yPos + 26)
  
  // Right column
  if (deviceInfo.serialNumber) {
    doc.text(`Serial #: ${deviceInfo.serialNumber}`, margin + 100, yPos + 18)
  }
  if (deviceInfo.imei) {
    doc.text(`IMEI: ${deviceInfo.imei}`, margin + 100, yPos + 26)
  }
  
  // Condition
  doc.text(`Condition: ${deviceInfo.condition || 'N/A'}`, margin + 5, yPos + 34)
  
  yPos += 55
  
  // Issue Description
  doc.setFont(undefined, 'bold')
  doc.setFontSize(11)
  doc.text('Issue Description:', margin, yPos)
  
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  const issueText = deviceInfo.issueDescription || 'No description provided'
  const splitIssue = doc.splitTextToSize(issueText, pageWidth - 2 * margin)
  doc.text(splitIssue, margin, yPos + 7)
  
  yPos += 7 + splitIssue.length * 5 + 10
  
  // Parts Used Table (if any)
  if (ticket.partsUsed && ticket.partsUsed.length > 0) {
    const partsData = ticket.partsUsed.map((part, index) => [
      index + 1,
      part.partName,
      part.quantity,
      `${storeSettings.currency || 'USD'} ${part.cost.toFixed(2)}`,
      `${storeSettings.currency || 'USD'} ${(part.cost * part.quantity).toFixed(2)}`,
    ])
    
    doc.autoTable({
      startY: yPos,
      head: [['#', 'Part Name', 'Qty', 'Unit Cost', 'Total']],
      body: partsData,
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
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    })
    
    yPos = doc.lastAutoTable.finalY + 10
  }
  
  // Cost Summary Section
  const costBoxX = pageWidth - margin - 70
  const costBoxWidth = 70
  const costBoxHeight = ticket.actualCost ? 50 : 35
  
  doc.setFillColor(...lightGray)
  doc.rect(costBoxX, yPos, costBoxWidth, costBoxHeight, 'F')
  
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Cost Summary', costBoxX + 5, yPos + 8)
  
  doc.setFont(undefined, 'normal')
  const currency = storeSettings.currency || 'USD'
  
  let costYPos = yPos + 16
  
  // Labor Cost
  doc.text('Labor:', costBoxX + 5, costYPos)
  doc.text(
    `${currency} ${(ticket.laborCost || 0).toFixed(2)}`,
    costBoxX + costBoxWidth - 5,
    costYPos,
    { align: 'right' }
  )
  
  costYPos += 8
  
  // Estimated Cost
  doc.text('Estimated:', costBoxX + 5, costYPos)
  doc.text(
    `${currency} ${(ticket.estimatedCost || 0).toFixed(2)}`,
    costBoxX + costBoxWidth - 5,
    costYPos,
    { align: 'right' }
  )
  
  // Actual Cost (if available)
  if (ticket.actualCost) {
    costYPos += 8
    doc.text('Actual:', costBoxX + 5, costYPos)
    doc.text(
      `${currency} ${ticket.actualCost.toFixed(2)}`,
      costBoxX + costBoxWidth - 5,
      costYPos,
      { align: 'right' }
    )
  }
  
  // Total (highlighted)
  costYPos += 10
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', costBoxX + 5, costYPos)
  doc.text(
    `${currency} ${(ticket.actualCost || ticket.estimatedCost || 0).toFixed(2)}`,
    costBoxX + costBoxWidth - 5,
    costYPos,
    { align: 'right' }
  )
  
  // Category (if available)
  if (ticket.categoryName) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Category:', margin, yPos + 8)
    doc.setFont(undefined, 'normal')
    doc.text(ticket.categoryName, margin, yPos + 16)
  }
  
  yPos += costBoxHeight + 10
  
  // Notes Section (if any)
  if (ticket.notes && ticket.notes.trim()) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text('Notes:', margin, yPos)
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(ticket.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPos + 7)
    
    yPos += 7 + splitNotes.length * 4 + 5
  }
  
  // Estimated Completion Date (if available)
  if (ticket.estimatedCompletion) {
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Estimated Completion:', margin, yPos)
    doc.setFont(undefined, 'normal')
    doc.text(
      new Date(ticket.estimatedCompletion).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      margin + 50,
      yPos
    )
  }
  
  // Footer
  yPos = pageHeight - 30
  
  doc.setDrawColor(...secondaryColor)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  
  doc.setTextColor(...secondaryColor)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  
  yPos += 7
  doc.text(
    'Please keep this ticket for reference. Contact us for any questions.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  
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
