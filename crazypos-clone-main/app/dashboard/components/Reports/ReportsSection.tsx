'use client'
import { useState } from 'react'
import { Product, Sale, RepairTicket } from '@/types'
import { PaymentsReport } from './PaymentsReport'

interface ReportsSectionProps {
  products: Product[]
  sales: Sale[]
  repairs: RepairTicket[]
}

export function ReportsSection({ products, sales, repairs }: ReportsSectionProps) {
  const [activeReportTab, setActiveReportTab] = useState('payments')
  // Calculate sales metrics
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const todaysSales = sales.filter(sale => new Date(sale.createdAt) >= todayStart)
  const weekSales = sales.filter(sale => new Date(sale.createdAt) >= weekStart)
  const monthSales = sales.filter(sale => new Date(sale.createdAt) >= monthStart)

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0)
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0)

  // Calculate inventory metrics
  const lowStockItems = products.filter(p => p.stock < 10)
  const outOfStockItems = products.filter(p => p.stock === 0)
  const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0)

  // Calculate repair metrics
  const activeRepairs = repairs.filter(r => r.status === 'in-progress' || r.status === 'waiting-parts')
  const completedRepairs = repairs.filter(r => r.status === 'completed')
  const avgRepairCost = repairs.length > 0 ? repairs.reduce((sum, r) => sum + r.estimatedCost, 0) / repairs.length : 0

  const reportTabs = [
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'overview', label: 'Overview', icon: '📊' },
  ]

  const renderOverviewReport = () => (
    <div className="p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Sales Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Today's Sales:</span>
              <div className="text-right">
                <span className="font-bold text-brand-700 dark:text-brand-400">${todaysRevenue.toFixed(2)}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">{todaysSales.length} transactions</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">This Week:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-slate-100">${weekRevenue.toFixed(2)}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">{weekSales.length} transactions</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">This Month:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-slate-100">${monthRevenue.toFixed(2)}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">{monthSales.length} transactions</div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
              <span className="text-slate-600 dark:text-slate-300">Total Sales:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ${sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                </span>
                <div className="text-xs text-slate-500 dark:text-slate-400">{sales.length} all-time transactions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Inventory Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Total Products:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{products.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Low Stock Items:</span>
              <span className="font-bold text-yellow-600 dark:text-yellow-400">{lowStockItems.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Out of Stock:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{outOfStockItems.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Total Units:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {products.reduce((sum, p) => sum + p.stock, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
              <span className="text-slate-600 dark:text-slate-300">Inventory Value:</span>
              <span className="font-bold text-brand-700 dark:text-brand-400">${totalInventoryValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Repair Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Repair Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Total Tickets:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{repairs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Active Repairs:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{activeRepairs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Completed:</span>
              <span className="font-bold text-green-600 dark:text-green-400">{completedRepairs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Avg. Repair Cost:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">${avgRepairCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
              <span className="text-slate-600 dark:text-slate-300">Total Revenue:</span>
              <span className="font-bold text-brand-700 dark:text-brand-400">
                ${completedRepairs.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Top Selling Products</h3>
          <div className="space-y-4">
            {sales.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">No sales data available</p>
            ) : (
              (() => {
                // Calculate product sales
                const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
                
                sales.forEach(sale => {
                  sale.items.forEach(item => {
                    const existing = productSales.get(item.productId)
                    if (existing) {
                      existing.quantity += item.quantity
                      existing.revenue += item.totalPrice
                    } else {
                      productSales.set(item.productId, {
                        name: item.productName,
                        quantity: item.quantity,
                        revenue: item.totalPrice
                      })
                    }
                  })
                })

                const topProducts = Array.from(productSales.values())
                  .sort((a, b) => b.quantity - a.quantity)
                  .slice(0, 5)

                return topProducts.length > 0 ? topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{product.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} units sold</div>
                    </div>
                    <div className="text-brand-700 dark:text-brand-400 font-bold">${product.revenue.toFixed(2)}</div>
                  </div>
                )) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">No product sales yet</p>
                )
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Report Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex space-x-1">
            {reportTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeReportTab === tab.id
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {activeReportTab === 'payments' && <PaymentsReport sales={sales} />}
      {activeReportTab === 'overview' && renderOverviewReport()}
    </div>
  )
}
