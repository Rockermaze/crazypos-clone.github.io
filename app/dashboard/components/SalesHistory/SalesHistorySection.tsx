'use client'
import { useState, useEffect } from 'react'
import { Sale } from '@/types'
import { downloadSalesReport } from './salesReport'

interface SalesHistorySectionProps {
  sales: Sale[]
}

interface DateRange {
  startDate: string
  endDate: string
}

interface SalesWithProfitData {
  sales: any[]
  summary: {
    totalSales: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    averageOrderValue: number
    profitMargin: number
  }
}

export function SalesHistorySection({ sales }: SalesHistorySectionProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // January 1st of current year
    endDate: new Date().toISOString().split('T')[0] // Today
  })
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportPreview, setReportPreview] = useState<SalesWithProfitData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Fetch sales data with profit calculations
  const fetchSalesWithProfit = async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/sales/with-profit?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching sales with profit:', error)
      throw error
    }
  }

  // Generate and preview financial report
  const handlePreviewReport = async () => {
    try {
      setIsGeneratingReport(true)
      const reportData = await fetchSalesWithProfit(dateRange.startDate, dateRange.endDate)
      setReportPreview(reportData)
      setShowPreview(true)
    } catch (error) {
      console.error('Error generating report preview:', error)
      alert('Failed to generate report preview. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Download formal financial report as PDF
  const handleDownloadReport = async () => {
    try {
      setIsGeneratingReport(true)
      
      // Use existing preview data or fetch new data
      let reportData = reportPreview
      if (!reportData) {
        reportData = await fetchSalesWithProfit(dateRange.startDate, dateRange.endDate)
      }
      
      if (!reportData.sales || reportData.sales.length === 0) {
        alert('No sales data found for the selected date range.')
        return
      }
      
      // Generate filename
      const startDateFormatted = dateRange.startDate ? new Date(dateRange.startDate).toISOString().split('T')[0] : 'all'
      const endDateFormatted = dateRange.endDate ? new Date(dateRange.endDate).toISOString().split('T')[0] : 'present'
      const filename = `Financial_Report_${startDateFormatted}_to_${endDateFormatted}.pdf`
      
      // Download the report
      await downloadSalesReport(
        reportData.sales,
        dateRange,
        filename
      )
      
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Filter existing sales data based on date range
  const getFilteredSales = () => {
    if (!dateRange.startDate && !dateRange.endDate) return sales
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt)
      const start = dateRange.startDate ? new Date(dateRange.startDate) : null
      const end = dateRange.endDate ? new Date(dateRange.endDate) : null
      
      if (start && saleDate < start) return false
      if (end) {
        const endOfDay = new Date(end)
        endOfDay.setHours(23, 59, 59, 999)
        if (saleDate > endOfDay) return false
      }
      
      return true
    })
  }

  const filteredSales = getFilteredSales()

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sales History</h2>
          
          {/* Date Range and Report Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Date Range Inputs */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date Range:</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="text-slate-500 dark:text-slate-400 self-center">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Report Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePreviewReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 text-sm font-semibold rounded-xl shadow-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    Preview Report
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-300 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    Download PDF Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Preview Modal */}
        {showPreview && reportPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Financial Report Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="p-6">
                {/* Report Summary */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                  <h4 className="text-md font-semibold mb-4 text-slate-900 dark:text-slate-100">Financial Summary</h4>
                  
                  {/* Primary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{reportPreview.summary.totalSales}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Sales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">${reportPreview.summary.totalRevenue.toFixed(2)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">${reportPreview.summary.totalCost.toFixed(2)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Cost of Goods</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${reportPreview.summary.totalProfit.toFixed(2)}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Net Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{reportPreview.summary.profitMargin.toFixed(1)}%</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Net Margin</div>
                    </div>
                  </div>
                  
                  {/* Tax Analysis Section */}
                  {reportPreview.summary.totalTax > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                      <h5 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Tax Analysis</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">${reportPreview.summary.totalSubtotal?.toFixed(2) || '0.00'}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Pre-Tax Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">${reportPreview.summary.totalTax?.toFixed(2) || '0.00'}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Tax Collected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-teal-600 dark:text-teal-400">${reportPreview.summary.grossProfit?.toFixed(2) || '0.00'}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Gross Profit</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{reportPreview.summary.grossProfitMargin?.toFixed(1) || '0.0'}%</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Gross Margin</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Report Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    disabled={isGeneratingReport}
                    className="px-4 py-2 bg-brand-700 hover:bg-brand-500 text-white rounded-xl shadow-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-brand-300 border-t-white rounded-full animate-spin"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <span>📄</span>
                        Download PDF Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Summary Stats for Filtered Data */}
        {filteredSales.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Period Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{filteredSales.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${filteredSales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${filteredSales.length > 0 ? (filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length).toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Avg Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {filteredSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Items Sold</div>
              </div>
            </div>
          </div>
        )}
        
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
              {sales.length === 0 ? 'No Sales Yet' : 'No Sales in Selected Period'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {sales.length === 0 
                ? 'Start selling to see your sales history here.' 
                : 'Try adjusting the date range to see sales data.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Receipt #</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Date</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Items</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Subtotal</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Tax</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Total</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Payment</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Customer</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice().reverse().map(sale => (
                  <tr key={sale.id} className="border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{sale.receiptNumber}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                      <div>
                        <span className="font-medium">{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</span>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {sale.items.map(item => (
                            <div key={item.productId}>
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100">${sale.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100">${sale.tax.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">${sale.total.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        sale.paymentMethod === 'digital' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {sale.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        {sale.customerInfo?.name && (
                          <div className="font-medium text-slate-900 dark:text-slate-100">{sale.customerInfo.name}</div>
                        )}
                        {sale.customerInfo?.email && (
                          <div className="text-xs">{sale.customerInfo.email}</div>
                        )}
                        {sale.customerInfo?.phone && (
                          <div className="text-xs">{sale.customerInfo.phone}</div>
                        )}
                        {!sale.customerInfo?.name && !sale.customerInfo?.email && !sale.customerInfo?.phone && (
                          <span className="text-slate-500 dark:text-slate-400">Guest</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
