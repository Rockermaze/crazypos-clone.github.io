'use client'
import { RepairTicket } from '@/types'

interface RepairsSectionProps {
  repairs: RepairTicket[]
  onAddRepair: () => void
}

export function RepairsSection({ repairs, onAddRepair }: RepairsSectionProps) {
  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Repair Management</h2>
          <button 
            onClick={onAddRepair}
            className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
          >
            New Repair Ticket
          </button>
        </div>
        
        {repairs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">No Repair Tickets</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first repair ticket to start tracking device repairs.</p>
            <button 
              onClick={onAddRepair}
              className="rounded-xl bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500"
            >
              Create First Repair Ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Ticket #</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Device</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Issue</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Status</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Priority</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Est. Cost</th>
                  <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Date</th>
                </tr>
              </thead>
              <tbody>
                {repairs.slice().reverse().map(repair => (
                  <tr key={repair.id} className="border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
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
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100">${repair.estimatedCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <div>{new Date(repair.dateReceived).toLocaleDateString()}</div>
                        {repair.estimatedCompletionDate && (
                          <div className="text-xs">
                            Est: {new Date(repair.estimatedCompletionDate).toLocaleDateString()}
                          </div>
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
