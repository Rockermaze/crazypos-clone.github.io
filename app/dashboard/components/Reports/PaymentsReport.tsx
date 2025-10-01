'use client'
import { useState, useMemo, useEffect } from 'react'
import { Sale } from '@/types'

interface PaymentsReportProps {
  sales: Sale[]
}

interface PaymentMethodTotal {
  method: string
  total: number
  count: number
  netAmount?: number
  fees?: number
}

interface TransactionStatistics {
  overall: {
    totalAmount: number
    totalNetAmount: number
    totalFees: number
    transactionCount: number
    averageAmount: number
    formattedTotalAmount?: string
    formattedTotalNetAmount?: string
    formattedAverageAmount?: string
  }
  statusBreakdown: Array<{
    status: string
    count: number
    amount: number
    formattedAmount: string
  }>
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    amount: number
    netAmount: number
    formattedAmount: string
  }>
  typeBreakdown: Array<{
    type: string
    count: number
    amount: number
    formattedAmount: string
  }>
  timeSeries: Array<{
    period: any
    amount: number
    netAmount: number
    count: number
    fees: number
  }>
  topCustomers: Array<{
    email: string
    name: string
    transactionCount: number
    totalAmount: number
    averageAmount: number
    formattedTotalAmount: string
    formattedAverageAmount: string
  }>
}

export function PaymentsReport({ sales }: PaymentsReportProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('Default')
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'analytics'>('overview')
  
  // Transaction statistics state
  const [transactionStats, setTransactionStats] = useState<TransactionStatistics | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Fetch transaction statistics from API
  const fetchTransactionStats = async () => {
    try {
      setLoadingStats(true)
      setStatsError(null)
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('period', 'day')
      
      const response = await fetch(`/api/transactions/statistics?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTransactionStats(data.data)
      } else {
        setStatsError(data.error || 'Failed to fetch transaction statistics')
      }
    } catch (error: any) {
      console.error('Error fetching transaction stats:', error)
      setStatsError(error.message || 'Failed to fetch transaction statistics')
    } finally {
      setLoadingStats(false)
    }
  }

  // Load transaction stats on component mount and when filters change
  useEffect(() => {
    fetchTransactionStats()
  }, [startDate, endDate])

  // Filter sales based on date range
  const filteredSales = useMemo(() => {
    let filtered = sales

    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter(sale => new Date(sale.createdAt) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(sale => new Date(sale.createdAt) <= end)
    }

    return filtered
  }, [sales, startDate, endDate])

  // Calculate payment method totals
  const paymentMethodTotals = useMemo(() => {
    const methods: Record<string, PaymentMethodTotal> = {
      'CASH': { method: 'Cash', total: 0, count: 0, netAmount: 0, fees: 0 },
      'CREDIT_CARD': { method: 'Credit Card', total: 0, count: 0, netAmount: 0, fees: 0 },
      'DEBIT_CARD': { method: 'Debit Card', total: 0, count: 0, netAmount: 0, fees: 0 },
      'PAYPAL': { method: 'PayPal', total: 0, count: 0, netAmount: 0, fees: 0 },
      'BANK_TRANSFER': { method: 'Bank Transfer', total: 0, count: 0, netAmount: 0, fees: 0 },
      'STORE_CREDIT': { method: 'Store Credit', total: 0, count: 0, netAmount: 0, fees: 0 },
      'SQUARE': { method: 'Square', total: 0, count: 0, netAmount: 0, fees: 0 },
      'CHECK': { method: 'Check', total: 0, count: 0, netAmount: 0, fees: 0 },
      // Legacy support
      'Cash': { method: 'Cash', total: 0, count: 0, netAmount: 0, fees: 0 },
      'Card': { method: 'Card', total: 0, count: 0, netAmount: 0, fees: 0 },
      'Online': { method: 'Online', total: 0, count: 0, netAmount: 0, fees: 0 },
      'Transfer': { method: 'Transfer', total: 0, count: 0, netAmount: 0, fees: 0 },
      'Store Credit': { method: 'Store Credit', total: 0, count: 0, netAmount: 0, fees: 0 },
      'Square': { method: 'Square', total: 0, count: 0, netAmount: 0, fees: 0 }
    }

    filteredSales.forEach(sale => {
      const method = sale.paymentMethod || 'CASH'
      const normalizedMethod = method.toUpperCase()
      
      // Map legacy methods to new ones
      const methodMap: Record<string, string> = {
        'CASH': 'CASH',
        'CARD': 'CREDIT_CARD',
        'ONLINE': 'PAYPAL',
        'TRANSFER': 'BANK_TRANSFER',
        'STORE CREDIT': 'STORE_CREDIT',
        'SQUARE': 'SQUARE'
      }
      
      const mappedMethod = methodMap[normalizedMethod] || normalizedMethod
      
      if (!methods[mappedMethod]) {
        methods[mappedMethod] = { 
          method: mappedMethod.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()), 
          total: 0, 
          count: 0, 
          netAmount: 0, 
          fees: 0 
        }
      }
      
      methods[mappedMethod].total += sale.total
      methods[mappedMethod].count += 1
      methods[mappedMethod].netAmount += (sale.netAmount || sale.total)
      methods[mappedMethod].fees += (sale.processingFee?.amount || 0)
    })

    return Object.values(methods).filter(method => method.count > 0)
  }, [filteredSales])

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString()

  // Render comprehensive analytics view
  const renderAnalyticsView = () => {
    if (loadingStats) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-300">Loading analytics...</span>
        </div>
      )
    }

    if (statsError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-700 dark:text-red-400">Error: {statsError}</p>
          <button 
            onClick={fetchTransactionStats}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      )
    }

    if (!transactionStats) {
      return (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No analytics data available</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Revenue</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {transactionStats.overall.formattedTotalAmount || formatCurrency(transactionStats.overall.totalAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {transactionStats.overall.transactionCount} transactions
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Net Amount</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {transactionStats.overall.formattedTotalNetAmount || formatCurrency(transactionStats.overall.totalNetAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              After fees and charges
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Processing Fees</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(transactionStats.overall.totalFees)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {((transactionStats.overall.totalFees / transactionStats.overall.totalAmount) * 100).toFixed(2)}% of total
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Average Transaction</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {transactionStats.overall.formattedAverageAmount || formatCurrency(transactionStats.overall.averageAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Per transaction
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment Method Analytics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {transactionStats.paymentMethodBreakdown.map((method) => (
                <div key={method.method} className="text-center">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{method.method}</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{method.formattedAmount}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{method.count} transactions</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Net: {formatCurrency(method.netAmount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Transaction Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {transactionStats.statusBreakdown.map((status) => {
                const getStatusColor = (statusName: string) => {
                  switch (statusName.toLowerCase()) {
                    case 'completed': return 'text-green-600 dark:text-green-400'
                    case 'pending': return 'text-yellow-600 dark:text-yellow-400'
                    case 'failed': return 'text-red-600 dark:text-red-400'
                    case 'processing': return 'text-blue-600 dark:text-blue-400'
                    default: return 'text-slate-600 dark:text-slate-400'
                  }
                }
                
                return (
                  <div key={status.status} className="text-center">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 capitalize">{status.status}</div>
                    <div className={`text-lg font-bold ${getStatusColor(status.status)}`}>{status.formattedAmount}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{status.count} transactions</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        {transactionStats.topCustomers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Customers</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {transactionStats.topCustomers.slice(0, 10).map((customer, index) => (
                  <div key={customer.email} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {customer.name || customer.email}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {customer.transactionCount} transactions • Avg: {customer.formattedAverageAmount}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-700 dark:text-brand-400">{customer.formattedTotalAmount}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header with Title and Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            💳 NetBanking & Payment Analytics
          </h1>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'transactions', label: 'Transactions', icon: '📋' },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === view.id
                      ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="mr-1">{view.icon}</span>
                  {view.label}
                </button>
              ))}
            </div>
            
            {/* Branch Selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="Default">Default</option>
              <option value="Main Store">Main Store</option>
              <option value="Branch 1">Branch 1</option>
              <option value="Branch 2">Branch 2</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="px-3 py-2 text-sm text-brand-700 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <>
          {/* Payment Method Breakdown - Top Section */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {paymentMethodTotals.map((method) => (
              <div key={method.method} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {method.method}
                  </div>
                  {method.method === 'PayPal' && (
                    <div className="text-blue-500 text-lg">🅿️</div>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(method.total)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {method.count} transactions
                </div>
                {method.fees && method.fees > 0 && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Fees: {formatCurrency(method.fees!)}
                  </div>
                )}
                {method.netAmount && method.netAmount !== method.total && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Net: {formatCurrency(method.netAmount!)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PayPal Specific Analytics */}
          {paymentMethodTotals.find(m => m.method === 'PayPal') && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">🅿️</div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">PayPal Integration Analytics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const paypalStats = paymentMethodTotals.find(m => m.method === 'PayPal')
                  if (!paypalStats) return null
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(paypalStats.total)}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Total PayPal Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(paypalStats.netAmount || paypalStats.total)}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Net After Fees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {formatCurrency(paypalStats.fees || 0)}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">PayPal Fees</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {activeView === 'transactions' && (
        /* Transaction Details Table */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Transaction Details
            </h2>
          </div>

          {filteredSales.length === 0 ? (
            /* No Data State */
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Data
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                No payment transactions found for the selected date range.
              </p>
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Receipt Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Net Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-700 dark:text-brand-400">
                        #{sale.receiptNumber}
                        {sale.paypalOrderId && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            PayPal: {sale.paypalOrderId.slice(-8)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          {sale.paymentMethod === 'PAYPAL' && '🅿️'}
                          {sale.paymentMethod || 'CASH'}
                          {sale.paymentGateway && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">({sale.paymentGateway})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (sale.paymentStatus || 'COMPLETED') === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : (sale.paymentStatus || 'COMPLETED') === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {sale.paymentStatus || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(sale.netAmount || sale.total)}
                        {sale.processingFee?.amount && sale.processingFee.amount > 0 && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            Fee: {formatCurrency(sale.processingFee.amount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(sale.createdAt)}
                        {sale.paymentProcessedAt && (
                          <div className="text-xs">
                            Processed: {formatDate(sale.paymentProcessedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeView === 'analytics' && renderAnalyticsView()}
    </div>
  )
}

