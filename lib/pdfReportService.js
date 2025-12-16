// PDF Report Generation Service
// Note: This requires jsPDF and jsPDF-AutoTable to be installed

export class PDFReportService {
  static async generateFinancialReport(salesData, summary, dateRange = null, userInfo = null) {
    // Ensure client-side execution to avoid SSR issues
    if (typeof window === 'undefined') {
      throw new Error('PDF generation must be called from the client-side context')
    }

    // Dynamic import to handle client-side loading (support both default and named exports)
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
    const autoTableModule = await import('jspdf-autotable')
    const autoTable = autoTableModule.default || autoTableModule.autoTable

    const doc = new jsPDF()
    let yPosition = 20
    // Report Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Report', 20, yPosition)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    yPosition += 10
    
    // Company/User Info
    if (userInfo) {
      doc.text(`Store: ${userInfo.storeName || 'YourPOS Store'}`, 20, yPosition)
      yPosition += 7
    }
    
    // Date range
    const currentDate = new Date().toLocaleDateString()
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      const startDate = dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString() : 'Beginning'
      const endDate = dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString() : 'Present'
      doc.text(`Period: ${startDate} - ${endDate}`, 20, yPosition)
    } else {
      doc.text(`Report Generated: ${currentDate}`, 20, yPosition)
    }
    yPosition += 7
    doc.text(`Total Transactions: ${summary.totalSales}`, 20, yPosition)
    yPosition += 15

    // Summary Statistics Box
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(20, yPosition, 170, 35)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Summary', 25, yPosition + 10)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    
    // Left column - Primary Metrics
    doc.text(`Total Revenue: $${summary.totalRevenue.toFixed(2)}`, 25, yPosition + 20)
    doc.text(`Cost of Goods: $${summary.totalCost.toFixed(2)}`, 25, yPosition + 27)
    doc.text(`Net Profit: $${summary.totalProfit.toFixed(2)}`, 25, yPosition + 34)
    
    // Right column - Analysis
    doc.text(`Net Margin: ${summary.profitMargin.toFixed(1)}%`, 105, yPosition + 20)
    doc.text(`Avg Order: $${summary.averageOrderValue.toFixed(2)}`, 105, yPosition + 27)
    
    // Tax analysis if applicable
    if (summary.totalTax && summary.totalTax > 0) {
      doc.text(`Tax Collected: $${summary.totalTax.toFixed(2)}`, 105, yPosition + 34)
      doc.text(`Gross Profit: $${(summary.grossProfit || 0).toFixed(2)}`, 105, yPosition + 41)
    }

    yPosition += 50

    // Sales Table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Sales Details', 20, yPosition)
    yPosition += 10

    // Prepare table data
    const tableData = salesData.map(sale => {
      const total = typeof sale.total === 'number' ? sale.total : Number(sale.total) || 0
      const totalCost = typeof sale.totalCost === 'number' ? sale.totalCost : Number(sale.totalCost) || 0
      const totalProfit = typeof sale.totalProfit === 'number' ? sale.totalProfit : Number(sale.totalProfit) || 0
      const profitMargin = typeof sale.profitMargin === 'number' ? sale.profitMargin : Number(sale.profitMargin) || 0
      const paymentMethod = (sale.paymentMethod || 'UNKNOWN').toString().toUpperCase()

      return [
        sale.receiptNumber || 'N/A',
        new Date(sale.createdAt).toLocaleDateString(),
        new Date(sale.createdAt).toLocaleTimeString(),
        `$${total.toFixed(2)}`,
        `$${totalCost.toFixed(2)}`,
        `$${totalProfit.toFixed(2)}`,
        `${profitMargin.toFixed(1)}%`,
        paymentMethod
      ]
    })

    // Add table using autotable plugin (v5 API)
    autoTable(doc, {
      startY: yPosition,
      head: [['Receipt #', 'Date', 'Time', 'Total', 'Cost', 'Profit', 'Margin %', 'Payment']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [63, 63, 70], // slate-700
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Receipt #
        1: { cellWidth: 22 }, // Date
        2: { cellWidth: 20 }, // Time
        3: { cellWidth: 20, halign: 'right' }, // Total
        4: { cellWidth: 20, halign: 'right' }, // Cost
        5: { cellWidth: 20, halign: 'right' }, // Profit
        6: { cellWidth: 18, halign: 'right' }, // Margin
        7: { cellWidth: 20 } // Payment
      }
    })

    // Get the final Y position after the table
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : (yPosition + 50)

    // Add new page if needed for item details
    if (finalY > 250) {
      doc.addPage()
      yPosition = 20
    } else {
      yPosition = finalY + 20
    }

    // Top Selling Items Analysis
    if (salesData.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Item Analysis', 20, yPosition)
      yPosition += 10

      // Aggregate items data
      const itemsMap = new Map()
      
      salesData.forEach(sale => {
        const items = Array.isArray(sale.items) ? sale.items : []
        items.forEach(item => {
          const key = item.productName
          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              name: item.productName,
              quantity: 0,
              revenue: 0,
              profit: 0,
              cost: 0
            })
          }
          
          const existing = itemsMap.get(key)
          existing.quantity += item.quantity
          existing.revenue += item.totalPrice
          existing.profit += (item.itemProfit || 0)
          existing.cost += (item.itemCost || 0)
        })
      })

      // Convert to array and sort by revenue
      const topItems = Array.from(itemsMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10) // Top 10 items

      const itemTableData = topItems.map(item => [
        item.name,
        item.quantity.toString(),
        `$${item.revenue.toFixed(2)}`,
        `$${item.cost.toFixed(2)}`,
        `$${item.profit.toFixed(2)}`,
        item.revenue > 0 ? `${((item.profit / item.revenue) * 100).toFixed(1)}%` : '0%'
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Product Name', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin %']],
        body: itemTableData,
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [63, 63, 70],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Product Name
          1: { cellWidth: 20, halign: 'center' }, // Quantity
          2: { cellWidth: 25, halign: 'right' }, // Revenue
          3: { cellWidth: 25, halign: 'right' }, // Cost
          4: { cellWidth: 25, halign: 'right' }, // Profit
          5: { cellWidth: 20, halign: 'right' } // Margin
        }
      })
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `YourPOS - Page ${i} of ${pageCount} - Generated on ${currentDate}`,
        20,
        doc.internal.pageSize.height - 10
      )
    }

    return doc
  }

  static async downloadReport(salesData, summary, dateRange = null, filename = null) {
    try {
      const doc = await this.generateFinancialReport(salesData, summary, dateRange)
      
      const defaultFilename = dateRange && (dateRange.startDate || dateRange.endDate)
        ? `Financial_Report_${dateRange.startDate || 'all'}_to_${dateRange.endDate || 'present'}.pdf`
        : `Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`
      
      doc.save(filename || defaultFilename)
      return true
    } catch (error) {
      console.error('Error generating PDF report:', error)
      throw new Error('Failed to generate PDF report')
    }
  }
}
