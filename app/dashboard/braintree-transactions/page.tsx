'use client'
import { useEffect, useState } from 'react'

interface BTTransaction {
  id: string
  transactionId: string
  amount: number
  netAmount: number
  currency: string
  status: string
  paymentMethod: string
  paymentGateway: string
  description: string
  createdAt: string
  formattedAmount: string
}

export default function BraintreeTransactionsPage() {
  const [data, setData] = useState<BTTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)

  const fetchPage = async (p = 1) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/braintree/transactions?page=${p}&limit=${limit}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch transactions')
      setData(json.data.transactions)
      setTotalPages(json.data.pagination.totalPages)
      setPage(p)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Braintree Transactions</h1>
        <button onClick={() => fetchPage(page)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Refresh</button>
      </div>

      {loading ? (
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4 text-sm font-mono">{t.transactionId}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{t.formattedAmount}</td>
                  <td className="px-6 py-4 text-sm capitalize">{t.status.toLowerCase()}</td>
                  <td className="px-6 py-4 text-sm">{t.paymentMethod} ({t.paymentGateway})</td>
                  <td className="px-6 py-4 text-sm">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-4">
            <button disabled={page<=1} onClick={() => fetchPage(page-1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Prev</button>
            <div className="text-sm">Page {page} / {totalPages}</div>
            <button disabled={page>=totalPages} onClick={() => fetchPage(page+1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}