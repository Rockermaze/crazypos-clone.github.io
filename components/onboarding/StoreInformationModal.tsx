'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'

interface StoreInformationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface StoreData {
  storeName: string
  storeCode: string
  timezone: string
  currency: string
  taxRate: number
  receiptHeader: string
  receiptFooter: string
  lowStockThreshold: number
  enableInventoryTracking: boolean
  enableMultiLocation: boolean
}

export function StoreInformationModal({ isOpen, onClose, onComplete }: StoreInformationModalProps) {
  const [formData, setFormData] = useState<StoreData>({
    storeName: '',
    storeCode: '',
    timezone: 'America/New_York',
    currency: 'USD',
    taxRate: 0,
    receiptHeader: 'Thank you for your purchase!',
    receiptFooter: 'Please visit us again',
    lowStockThreshold: 10,
    enableInventoryTracking: true,
    enableMultiLocation: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      if (!isOpen) return
      
      try {
        const response = await fetch('/api/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.storeInformation) {
            setFormData(prev => ({ ...prev, ...data.settings.storeInformation }))
          } else if (!formData.storeCode) {
            // Generate a unique store code if not set
            const code = `STORE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            setFormData(prev => ({ ...prev, storeCode: code }))
          }
        }
      } catch (error) {
        // Generate store code on error
        if (!formData.storeCode) {
          const code = `STORE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          setFormData(prev => ({ ...prev, storeCode: code }))
        }
      }
    }
    
    loadSettings()
  }, [isOpen])

  const handleInputChange = (field: keyof StoreData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      // Save store information to user settings
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeInformation: formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save store information')
      }

      // Mark this task as completed
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'storeInformation',
          completed: true
        })
      })

      onComplete()
    } catch (err) {
      setError('Failed to save store information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Store Information">
      <div className="space-y-6">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Configure your store settings and preferences for optimal operations.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Main Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Store Code
            </label>
            <input
              type="text"
              value={formData.storeCode}
              onChange={(e) => handleInputChange('storeCode', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="STORE-001"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Unique identifier for this store location
            </p>
          </div>

          {/* Regional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Chicago">Central Time (US)</option>
                <option value="America/Denver">Mountain Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Default Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="8.5"
            />
          </div>

          {/* Receipt Settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Receipt Customization
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Header Message
                </label>
                <input
                  type="text"
                  value={formData.receiptHeader}
                  onChange={(e) => handleInputChange('receiptHeader', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Thank you for your purchase!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={formData.receiptFooter}
                  onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Please visit us again"
                />
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Inventory Management
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="10"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alert when product quantity falls below this number
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableInventoryTracking}
                  onChange={(e) => handleInputChange('enableInventoryTracking', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Inventory Tracking
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically track stock levels for all products
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableMultiLocation}
                  onChange={(e) => handleInputChange('enableMultiLocation', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Multi-Location Support
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Manage inventory across multiple store locations
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
