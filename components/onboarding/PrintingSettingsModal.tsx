'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'

interface PrintingSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface PrinterData {
  receiptPrinter: string
  labelPrinter: string
  paperSize: '58mm' | '80mm' | 'A4'
  enableAutoPrint: boolean
  printCopies: number
  showPrices: boolean
  showBarcode: boolean
  showLogo: boolean
}

export function PrintingSettingsModal({ isOpen, onClose, onComplete }: PrintingSettingsModalProps) {
  const [formData, setFormData] = useState<PrinterData>({
    receiptPrinter: 'default',
    labelPrinter: 'none',
    paperSize: '80mm',
    enableAutoPrint: false,
    printCopies: 1,
    showPrices: true,
    showBarcode: true,
    showLogo: true
  })
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  // Load existing settings when modal opens
  useEffect(() => {
    const loadSettings = async () => {
      if (!isOpen) return
      
      try {
        const response = await fetch('/api/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.printingSettings) {
            setFormData(prev => ({ ...prev, ...data.settings.printingSettings }))
          }
        }
      } catch (error) {
        // Silently fail - user can still enter data
      }
    }
    
    loadSettings()
  }, [isOpen])

  const handleInputChange = (field: keyof PrinterData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePrintDemo = () => {
    setShowPreview(true)
    // Simulate printing
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      // Save printing settings to user settings
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printingSettings: formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save printing settings')
      }

      // Mark this task as completed
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'printingSettings',
          completed: true
        })
      })

      onComplete()
    } catch (err) {
      setError('Failed to save printing settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Printing Settings">
      <div className="space-y-6">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Configure your receipt and label printers. You can test printing with a demo receipt.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Printer Selection */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Printer Configuration
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Receipt Printer
                </label>
                <select
                  value={formData.receiptPrinter}
                  onChange={(e) => handleInputChange('receiptPrinter', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="default">System Default Printer</option>
                  <option value="thermal">Thermal Receipt Printer</option>
                  <option value="star">Star TSP143III</option>
                  <option value="epson">Epson TM-T88V</option>
                  <option value="none">No Printer (Save Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Label Printer (Optional)
                </label>
                <select
                  value={formData.labelPrinter}
                  onChange={(e) => handleInputChange('labelPrinter', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="none">None</option>
                  <option value="dymo">DYMO LabelWriter</option>
                  <option value="brother">Brother QL-Series</option>
                  <option value="zebra">Zebra ZD410</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Paper Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['58mm', '80mm', 'A4'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleInputChange('paperSize', size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.paperSize === size
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium'
                          : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Print Options */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Print Options
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableAutoPrint}
                  onChange={(e) => handleInputChange('enableAutoPrint', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Auto-Print Receipts
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically print receipts after each sale
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.printCopies}
                  onChange={(e) => handleInputChange('printCopies', parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Receipt Content
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showLogo}
                  onChange={(e) => handleInputChange('showLogo', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Show Company Logo
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showPrices}
                  onChange={(e) => handleInputChange('showPrices', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Show Item Prices
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showBarcode}
                  onChange={(e) => handleInputChange('showBarcode', e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Show Receipt Barcode
                </div>
              </label>
            </div>
          </div>

          {/* Demo Print Button */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              type="button"
              onClick={handlePrintDemo}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span className="text-lg">🖨️</span>
              Try Demo Print
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Test your printer with a sample receipt
            </p>
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

      {/* Demo Receipt Preview (for print) */}
      {showPreview && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-4">
              {formData.showLogo && (
                <div className="text-4xl mb-2">🏪</div>
              )}
              <h2 className="font-bold text-lg">CrazyPOS Demo Store</h2>
              <p className="text-sm">123 Business Street</p>
              <p className="text-sm">City, State 12345</p>
              <p className="text-sm">Tel: (555) 123-4567</p>
            </div>
            
            <div className="border-t-2 border-b-2 border-dashed py-2 my-4">
              <p className="text-sm">Receipt #: DEMO-001</p>
              <p className="text-sm">Date: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span>Sample Product 1</span>
                {formData.showPrices && <span>$10.00</span>}
              </div>
              <div className="flex justify-between text-sm">
                <span>Sample Product 2</span>
                {formData.showPrices && <span>$25.00</span>}
              </div>
            </div>
            
            <div className="border-t-2 border-dashed pt-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>$35.00</span>
              </div>
            </div>
            
            {formData.showBarcode && (
              <div className="text-center mt-4">
                <div className="font-mono text-xs">|||  || ||| | || |||  ||</div>
                <p className="text-xs mt-1">*DEMO-001*</p>
              </div>
            )}
            
            <div className="text-center mt-4 text-sm">
              <p>Thank you for your purchase!</p>
              <p className="text-xs mt-2">This is a demo receipt</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
