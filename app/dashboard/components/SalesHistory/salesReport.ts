'use client'

import { PDFReportService } from '@/lib/pdfReportService'
import type { Sale } from '@/types'

export interface DateRange {
  startDate?: string | null
  endDate?: string | null
}

export async function downloadSalesReport(
  sales: Sale[],
  dateRange?: DateRange,
  filename?: string
) {
  // Build a minimal summary if the caller does not provide one
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)
  const totalCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0)
  const totalProfit = sales.reduce((sum, s) => sum + ((s.totalProfit as number) || 0), 0)
  const averageOrderValue = sales.length ? totalRevenue / sales.length : 0
  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0

  const summary = {
    totalSales: sales.length,
    totalRevenue,
    totalCost,
    totalProfit,
    averageOrderValue,
    profitMargin,
    // Optional extra fields used conditionally by the PDF service
    totalTax: sales.reduce((sum, s) => sum + (s.tax || 0), 0),
    grossProfit: totalProfit,
  } as any

  const startDateFormatted = dateRange?.startDate ? new Date(dateRange.startDate).toISOString().split('T')[0] : 'all'
  const endDateFormatted = dateRange?.endDate ? new Date(dateRange.endDate).toISOString().split('T')[0] : 'present'
  const defaultFilename = `Sales_Report_${startDateFormatted}_to_${endDateFormatted}.pdf`

  return PDFReportService.downloadReport(sales as any, summary, dateRange as any, filename || defaultFilename)
}