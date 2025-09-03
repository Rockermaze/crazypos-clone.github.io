'use client'
import { useState } from 'react'
import { StoreSettings } from '@/types'

interface SettingsSectionProps {
  settings: StoreSettings | null
  onSaveSettings?: (settings: Partial<StoreSettings>) => void
}

export function SettingsSection({ settings, onSaveSettings }: SettingsSectionProps) {
  const [formData, setFormData] = useState({
    storeName: settings?.storeName || 'Your Store',
    storeAddress: settings?.storeAddress || '123 Main St, City, State 12345',
    storePhone: settings?.storePhone || '+1 (555) 123-4567',
    storeEmail: settings?.storeEmail || 'store@example.com',
    taxRate: settings?.taxRate || 8.25,
    currency: settings?.currency || 'USD',
    receiptFooter: settings?.receiptFooter || 'Thank you for your business!',
    lowStockThreshold: settings?.lowStockThreshold || 10
  })

  const [isEdited, setIsEdited] = useState(false)

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsEdited(true)
  }

  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings(formData)
      setIsEdited(false)
    }
  }

  const handleReset = () => {
    setFormData({
      storeName: settings?.storeName || 'Your Store',
      storeAddress: settings?.storeAddress || '123 Main St, City, State 12345',
      storePhone: settings?.storePhone || '+1 (555) 123-4567',
      storeEmail: settings?.storeEmail || 'store@example.com',
      taxRate: settings?.taxRate || 8.25,
      currency: settings?.currency || 'USD',
      receiptFooter: settings?.receiptFooter || 'Thank you for your business!',
      lowStockThreshold: settings?.lowStockThreshold || 10
    })
    setIsEdited(false)
  }

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl">
        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Store Settings</h2>
        
        <div className="space-y-6">
          {/* Store Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Store Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Store Address
              </label>
              <textarea
                rows={3}
                value={formData.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.storePhone}
                  onChange={(e) => handleInputChange('storePhone', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.storeEmail}
                  onChange={(e) => handleInputChange('storeEmail', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Business Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Products with stock below this number will be flagged as low stock
              </p>
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Receipt Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Receipt Footer Message
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                placeholder="Thank you for your business!"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This message will appear at the bottom of all receipts
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-600">
            <button 
              onClick={handleSave}
              disabled={!isEdited}
              className={`rounded-xl px-6 py-3 font-medium ${
                isEdited
                  ? 'bg-brand-700 hover:bg-brand-500 text-white'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              Save Settings
            </button>
            <button 
              onClick={handleReset}
              disabled={!isEdited}
              className={`rounded-xl border px-6 py-2 font-medium ${
                isEdited
                  ? 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Reset Changes
            </button>
          </div>

          {isEdited && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center">
                <div className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  You have unsaved changes. Don't forget to save your settings.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
