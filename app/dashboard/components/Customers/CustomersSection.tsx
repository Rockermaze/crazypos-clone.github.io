'use client'
import { useState, useEffect } from 'react'

interface Customer {
  id: string
  customerId: string
  name: string
  email?: string
  phone: string
  dueAmount: number
  totalPurchases: number
  purchaseCount: number
  averagePurchaseValue: number
  purchaseHistory: Array<{
    saleId: string
    amount: number
    date: string
    receiptNumber: string
  }>
  paymentHistory: Array<{
    amount: number
    paymentMethod: string
    date: string
    notes?: string
  }>
  notes?: string
  tags: string[]
  loyaltyPoints: number
  lastPurchaseDate?: string
  createdAt: string
}

interface CustomerStats {
  totalCustomers: number
  totalDueAmount: number
  totalPurchaseValue: number
  averagePurchaseValue: number
  customersWithDues: number
}

interface CustomersSectionProps {
  onNotification: (message: string, type: 'success' | 'error') => void
}

export function CustomersSection({ onNotification }: CustomersSectionProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'withDues' | 'top'>('all')
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'new'>('view')
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    dueAmount: 0
  })
  
  // Payment/Due modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'DEBIT_CARD' | 'CREDIT_CARD'>('CASH')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [showAddDueModal, setShowAddDueModal] = useState(false)
  const [dueAmount, setDueAmount] = useState(0)
  const [dueReason, setDueReason] = useState('')

  useEffect(() => {
    loadCustomers()
    loadStats()
  }, [filterType])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchCustomers()
    } else if (searchQuery.length === 0) {
      loadCustomers()
    }
  }, [searchQuery])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      let url = '/api/customers'
      
      if (filterType === 'withDues') {
        url += '?withDues=true'
      } else if (filterType === 'top') {
        url += '?top=20'
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      onNotification('Failed to load customers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/customers/statistics')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.statistics)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const searchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error searching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerDetails = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedCustomer(data.customer)
        setModalMode('view')
        setShowCustomerModal(true)
      }
    } catch (error) {
      console.error('Error loading customer details:', error)
      onNotification('Failed to load customer details', 'error')
    }
  }

  const handleAddNewCustomer = () => {
    setFormData({ name: '', email: '', phone: '', notes: '', dueAmount: 0 })
    setSelectedCustomer(null)
    setModalMode('new')
    setShowCustomerModal(true)
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setFormData({
        name: selectedCustomer.name,
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone,
        notes: selectedCustomer.notes || '',
        dueAmount: selectedCustomer.dueAmount
      })
      setModalMode('edit')
    }
  }

  const handleSaveCustomer = async () => {
    try {
      if (!formData.name || !formData.phone) {
        onNotification('Name and phone are required', 'error')
        return
      }

      const url = modalMode === 'new' ? '/api/customers' : `/api/customers/${selectedCustomer?.id}`
      const method = modalMode === 'new' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        onNotification(data.message || 'Customer saved successfully', 'success')
        setShowCustomerModal(false)
        loadCustomers()
        loadStats()
      } else {
        onNotification(data.error || 'Failed to save customer', 'error')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      onNotification('Failed to save customer', 'error')
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        onNotification('Customer deactivated successfully', 'success')
        setShowCustomerModal(false)
        loadCustomers()
        loadStats()
      } else {
        onNotification(data.error || 'Failed to deactivate customer', 'error')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      onNotification('Failed to deactivate customer', 'error')
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedCustomer) return

    try {
      if (paymentAmount <= 0 || paymentAmount > selectedCustomer.dueAmount) {
        onNotification('Invalid payment amount', 'error')
        return
      }

      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addPayment: {
            amount: paymentAmount,
            paymentMethod,
            notes: paymentNotes
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        onNotification('Payment recorded successfully', 'success')
        setShowPaymentModal(false)
        setPaymentAmount(0)
        setPaymentNotes('')
        loadCustomerDetails(selectedCustomer.id)
        loadStats()
      } else {
        onNotification(data.error || 'Failed to record payment', 'error')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      onNotification('Failed to record payment', 'error')
    }
  }

  const handleAddDue = async () => {
    if (!selectedCustomer) return

    try {
      if (dueAmount <= 0) {
        onNotification('Invalid due amount', 'error')
        return
      }

      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addDue: {
            amount: dueAmount,
            reason: dueReason
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        onNotification('Due amount added successfully', 'success')
        setShowAddDueModal(false)
        setDueAmount(0)
        setDueReason('')
        loadCustomerDetails(selectedCustomer.id)
        loadStats()
      } else {
        onNotification(data.error || 'Failed to add due', 'error')
      }
    } catch (error) {
      console.error('Error adding due:', error)
      onNotification('Failed to add due', 'error')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Customers</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalCustomers}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Sales</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalPurchaseValue.toFixed(2)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">Avg. Purchase</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${stats.averagePurchaseValue.toFixed(2)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">Outstanding Dues</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${stats.totalDueAmount.toFixed(2)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">With Dues</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.customersWithDues}</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search by name, phone, email, or customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('withDues')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'withDues'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              With Dues
            </button>
            <button
              onClick={() => setFilterType('top')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'top'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Top Customers
            </button>
          </div>

          <button
            onClick={handleAddNewCustomer}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Customer ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Purchases</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Total Spent</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Due Amount</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No customers found. Add your first customer to get started!
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      customer.dueAmount > 0 ? 'bg-red-50/30 dark:bg-red-900/10 border-l-4 border-red-500' : ''
                    }`}
                    onClick={() => loadCustomerDetails(customer.id)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 font-mono">
                      {customer.customerId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{customer.name}</div>
                      {customer.lastPurchaseDate && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                      {customer.purchaseCount}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">
                      ${customer.totalPurchases.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {customer.dueAmount > 0 ? (
                        <span className="font-medium text-red-600 dark:text-red-400">
                          ${customer.dueAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">$0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          loadCustomerDetails(customer.id)
                        }}
                        className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail/Edit Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {modalMode === 'new' ? 'Add New Customer' : modalMode === 'edit' ? 'Edit Customer' : 'Customer Details'}
              </h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {modalMode === 'view' && selectedCustomer ? (
                <>
                  {/* Customer Info Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedCustomer.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">ID: {selectedCustomer.customerId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditCustomer}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Phone</div>
                      <div className="text-lg font-medium text-slate-900 dark:text-slate-100">{selectedCustomer.phone}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</div>
                      <div className="text-lg font-medium text-slate-900 dark:text-slate-100">{selectedCustomer.email || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-1">Total Purchases</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        ${selectedCustomer.totalPurchases.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Purchase Count</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedCustomer.purchaseCount}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Avg. Purchase</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        ${selectedCustomer.averagePurchaseValue.toFixed(2)}
                      </div>
                    </div>
                    <div className={`rounded-lg p-4 border ${
                      selectedCustomer.dueAmount > 0 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                    }`}>
                      <div className={`text-sm mb-1 ${
                        selectedCustomer.dueAmount > 0 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>Due Amount</div>
                      <div className={`text-2xl font-bold ${
                        selectedCustomer.dueAmount > 0 
                          ? 'text-red-900 dark:text-red-100' 
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        ${selectedCustomer.dueAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Due Actions */}
                  {selectedCustomer.dueAmount > 0 && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setPaymentAmount(selectedCustomer.dueAmount)
                          setShowPaymentModal(true)
                        }}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => setShowAddDueModal(true)}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                      >
                        Add Due Amount
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedCustomer.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">Notes</div>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                        {selectedCustomer.notes}
                      </div>
                    </div>
                  )}

                  {/* Purchase History */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Purchase History</h4>
                    {selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedCustomer.purchaseHistory.map((purchase, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                Receipt #{purchase.receiptNumber}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(purchase.date).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                              ${purchase.amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-4">No purchase history</p>
                    )}
                  </div>

                  {/* Payment History (for dues) */}
                  {selectedCustomer.paymentHistory && selectedCustomer.paymentHistory.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Payment History</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedCustomer.paymentHistory.map((payment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {payment.paymentMethod} Payment
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(payment.date).toLocaleString()}
                              </div>
                              {payment.notes && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{payment.notes}</div>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                              ${payment.amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Edit/New Customer Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Customer name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Additional notes about the customer..."
                    />
                  </div>

                  {modalMode === 'new' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Initial Due Amount (if any)
                      </label>
                      <input
                        type="number"
                        value={formData.dueAmount}
                        onChange={(e) => setFormData({ ...formData, dueAmount: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (modalMode === 'edit') {
                          setModalMode('view')
                        } else {
                          setShowCustomerModal(false)
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCustomer}
                      className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
                    >
                      {modalMode === 'new' ? 'Add Customer' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Payment</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current due: ${selectedCustomer.dueAmount.toFixed(2)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  max={selectedCustomer.dueAmount}
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Payment notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Due Modal */}
      {showAddDueModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Due Amount</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <textarea
                  value={dueReason}
                  onChange={(e) => setDueReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Reason for due amount..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddDueModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDue}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                >
                  Add Due
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
