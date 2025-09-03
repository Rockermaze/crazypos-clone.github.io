'use client'
import { Sale } from '@/types'

interface SalesHistorySectionProps {
  sales: Sale[]
}

export function SalesHistorySection({ sales }: SalesHistorySectionProps) {
  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Sales History</h2>
        
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">No Sales Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">Start selling to see your sales history here.</p>
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
                {sales.slice().reverse().map(sale => (
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
