'use client'
import { useState, useMemo } from 'react'
import { Sale } from '@/types'

interface PaymentsReportProps {
  sales: Sale[]
}

interface PaymentMethodTotal {
  method: string
  total: number
  count: number
}

export function PaymentsReport({ sales }: PaymentsReportProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('Default')

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
      'Cash': { method: 'Cash', total: 0, count: 0 },
      'Card': { method: 'Card', total: 0, count: 0 },
      'Online': { method: 'Online', total: 0, count: 0 },
      'Transfer': { method: 'Transfer', total: 0, count: 0 },
      'Store Credit': { method: 'Store Credit', total: 0, count: 0 },
      'Square': { method: 'Square', total: 0, count: 0 }
    }

    filteredSales.forEach(sale => {
      const method = sale.paymentMethod || 'Cash'
      if (methods[method]) {
        methods[method].total += sale.total
        methods[method].count += 1
      } else {
        // Handle any payment methods not in our predefined list
        if (!methods[method]) {
          methods[method] = { method, total: 0, count: 0 }
        }
        methods[method].total += sale.total
        methods[method].count += 1
      }
    })

    return Object.values(methods)
  }, [filteredSales])

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString()

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header with Title and Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            📊 Payments Report
          </h1>
          <div className="flex items-center gap-4">
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

      {/* Payment Method Breakdown - Top Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {paymentMethodTotals.map((method) => (
          <div key={method.method} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              {method.method}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(method.total)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {method.count} transactions
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method Breakdown - Square Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
          Square
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(paymentMethodTotals.find(m => m.method === 'Square')?.total || 0)}
        </div>
      </div>

      {/* Transaction Details Table - Bottom Section */}
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
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Order Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSales.map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {selectedBranch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-700 dark:text-brand-400">
                      #{sale.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {sale.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Sale
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(sale.createdAt)}
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
