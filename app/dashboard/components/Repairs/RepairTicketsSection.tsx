'use client'
import { useState } from 'react'
import type { RepairTicket, RepairTicketsSectionProps } from '@/types/repair'

export function RepairTicketsSection({ repairs, onAddRepair, onUpdateRepairStatus }: RepairTicketsSectionProps) {
  const [updatingRepair, setUpdatingRepair] = useState<string | null>(null)

  const handleStatusUpdate = async (repairId: string, status: RepairTicket['status']) => {
    setUpdatingRepair(repairId)
    try {
      await onUpdateRepairStatus(repairId, status)
    } finally {
      setUpdatingRepair(null)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Repair Tickets</h3>
        <button 
          onClick={onAddRepair}
          className="rounded-lg bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500 transition-colors"
        >
          New Repair Ticket
        </button>
      </div>
      
      {repairs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h4 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">No Repair Tickets</h4>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first repair ticket to start tracking device repairs.</p>
          <button 
            onClick={onAddRepair}
            className="rounded-lg bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500 transition-colors"
          >
            Create First Repair Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Ticket #</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Device</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Issue</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Priority</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Est. Cost</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repairs.slice().reverse().map((repair, index) => (
                  <tr key={repair.id} className={`border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-700' : 'bg-slate-25 dark:bg-slate-750'}`}>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{repair.ticketNumber}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{repair.customerInfo.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{repair.customerInfo.phone}</p>
                        {repair.customerInfo.email && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{repair.customerInfo.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{repair.deviceInfo.brand} {repair.deviceInfo.model}</p>
                        {repair.deviceInfo.serialNumber && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">S/N: {repair.deviceInfo.serialNumber}</p>
                        )}
                        {repair.deviceInfo.imei && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">IMEI: {repair.deviceInfo.imei}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {repair.categoryName ? (
                        <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                          {repair.categoryName}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">No category</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-sm text-slate-900 dark:text-slate-100 truncate" title={repair.deviceInfo.issueDescription}>
                        {repair.deviceInfo.issueDescription}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        repair.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        repair.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        repair.status === 'waiting-parts' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        repair.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {repair.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        repair.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        repair.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        repair.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {repair.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-medium">${repair.estimatedCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <div>{new Date(repair.dateReceived).toLocaleDateString()}</div>
                        {repair.estimatedCompletionDate && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Est: {new Date(repair.estimatedCompletionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {repair.status !== 'completed' && repair.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(repair.id, 'completed')}
                            disabled={updatingRepair === repair.id}
                            className="bg-green-100 hover:bg-green-200 disabled:bg-green-50 disabled:text-green-400 text-green-800 px-3 py-1 rounded-full text-xs font-medium transition-colors dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 dark:disabled:bg-green-900/10 dark:disabled:text-green-600"
                            title="Mark as Complete"
                          >
                            {updatingRepair === repair.id ? '⏳ ...' : '✓ Complete'}
                          </button>
                        )}
                        {repair.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(repair.id, 'in-progress')}
                            disabled={updatingRepair === repair.id}
                            className="bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-400 text-blue-800 px-3 py-1 rounded-full text-xs font-medium transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:disabled:bg-blue-900/10 dark:disabled:text-blue-600"
                            title="Start Repair"
                          >
                            {updatingRepair === repair.id ? '⏳ ...' : '▶ Start'}
                          </button>
                        )}
                        {repair.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusUpdate(repair.id, 'waiting-parts')}
                            disabled={updatingRepair === repair.id}
                            className="bg-yellow-100 hover:bg-yellow-200 disabled:bg-yellow-50 disabled:text-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium transition-colors dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400 dark:disabled:bg-yellow-900/10 dark:disabled:text-yellow-600"
                            title="Waiting for Parts"
                          >
                            {updatingRepair === repair.id ? '⏳ ...' : '⏸ Parts'}
                          </button>
                        )}
                        {repair.status === 'completed' && (
                          <button
                            onClick={() => handleStatusUpdate(repair.id, 'picked-up')}
                            disabled={updatingRepair === repair.id}
                            className="bg-purple-100 hover:bg-purple-200 disabled:bg-purple-50 disabled:text-purple-400 text-purple-800 px-3 py-1 rounded-full text-xs font-medium transition-colors dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400 dark:disabled:bg-purple-900/10 dark:disabled:text-purple-600"
                            title="Mark as Picked Up"
                          >
                            {updatingRepair === repair.id ? '⏳ ...' : '📦 Picked Up'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
