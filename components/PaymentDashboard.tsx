'use client'
import { useState, useEffect } from 'react'

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
  recentTransactions: Array<{
    transactionId: string
    amount: number
    currency: string
    type: string
    status: string
    paymentMethod: string
    description: string
    createdAt: string
    formattedAmount: string
  }>
}

interface PaymentDashboardProps {
  className?: string
}

export function PaymentDashboard({ className = '' }: PaymentDashboardProps) {
  const [stats, setStats] = useState<TransactionStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Fetch transaction statistics
  const fetchStats = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/transactions/statistics')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || 'Failed to fetch statistics')
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      setError(error.message || 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  // Setup auto-refresh
  useEffect(() => {
    fetchStats()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    setRefreshInterval(interval)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true)
    fetchStats()
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'processing': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'cancelled': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'paypal': return '🅿️'
      case 'cash': return '💵'
      case 'credit_card': return '💳'
      case 'debit_card': return '💳'
      case 'bank_transfer': return '🏦'
      case 'square': return '⬜'
      case 'store_credit': return '🎟️'
      case 'check': return '📝'
      default: return '💰'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="text-center py-8">
          <div className="text-slate-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Payment Data
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No payment transactions found. Start processing payments to see analytics here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              💳 Payment Dashboard
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Real-time payment analytics and transaction overview
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.overall.formattedTotalAmount || formatCurrency(stats.overall.totalAmount)}
                </p>
              </div>
              <div className="text-blue-500 text-2xl">💰</div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {stats.overall.transactionCount} transactions
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">Net Amount</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.overall.formattedTotalNetAmount || formatCurrency(stats.overall.totalNetAmount)}
                </p>
              </div>
              <div className="text-green-500 text-2xl">✅</div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-2">
              After processing fees
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">Processing Fees</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(stats.overall.totalFees)}
                </p>
              </div>
              <div className="text-orange-500 text-2xl">📊</div>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {((stats.overall.totalFees / stats.overall.totalAmount) * 100).toFixed(2)}% of total
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">Avg Transaction</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.overall.formattedAverageAmount || formatCurrency(stats.overall.averageAmount)}
                </p>
              </div>
              <div className="text-purple-500 text-2xl">📈</div>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Per transaction
            </div>
          </div>
        </div>

        {/* Payment Methods & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Payment Methods
            </h3>
            <div className="space-y-3">
              {stats.paymentMethodBreakdown.map((method) => (
                <div key={method.method} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPaymentMethodIcon(method.method)}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {method.method}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {method.count} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {method.formattedAmount}
                    </div>
                    {method.netAmount !== method.amount && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Net: {formatCurrency(method.netAmount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Status */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Transaction Status
            </h3>
            <div className="space-y-3">
              {stats.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {status.count} transactions
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {status.formattedAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </h3>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Last {stats.recentTransactions.length} transactions
              </span>
            </div>
            <div className="space-y-2">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.transactionId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.transactionId}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {transaction.description} • {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {transaction.formattedAmount}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Auto-refreshing every 30 seconds
          </div>
        </div>
      </div>
    </div>
  )
}