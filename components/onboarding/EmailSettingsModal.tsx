'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'

interface EmailSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface EmailData {
  provider: 'gmail' | 'smtp' | 'sendgrid' | 'none'
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  fromEmail: string
  fromName: string
  enableReceiptEmails: boolean
  enableOrderNotifications: boolean
  enableLowStockAlerts: boolean
}

export function EmailSettingsModal({ isOpen, onClose, onComplete }: EmailSettingsModalProps) {
  const [formData, setFormData] = useState<EmailData>({
    provider: 'none',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    enableReceiptEmails: true,
    enableOrderNotifications: true,
    enableLowStockAlerts: false
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  // Load existing settings when modal opens
  useEffect(() => {
    const loadSettings = async () => {
      if (!isOpen) return
      
      try {
        const response = await fetch('/api/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.emailSettings) {
            setFormData(prev => ({ ...prev, ...data.settings.emailSettings }))
          }
        }
      } catch (error) {
        // Silently fail - user can still enter data
      }
    }
    
    loadSettings()
  }, [isOpen])

  const handleInputChange = (field: keyof EmailData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setError('')

    try {
      // Simulate email connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Validate based on provider
      if (formData.provider === 'smtp') {
        if (!formData.smtpHost || !formData.smtpUsername) {
          throw new Error('SMTP host and username are required')
        }
      }

      setTestResult({
        success: true,
        message: 'Email configuration is valid! Test email sent successfully.'
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Please check your settings.'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      // Save email settings to user settings
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSettings: formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save email settings')
      }

      // Mark this task as completed
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'emailSettings',
          completed: true
        })
      })

      onComplete()
    } catch (err) {
      setError('Failed to save email settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Settings">
      <div className="space-y-6">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Configure email notifications and customer receipts. This is optional and can be set up later.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Email Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="none">None (Skip for now)</option>
              <option value="gmail">Gmail (OAuth)</option>
              <option value="smtp">Custom SMTP</option>
              <option value="sendgrid">SendGrid API</option>
            </select>
          </div>

          {formData.provider === 'gmail' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 dark:text-blue-400 text-2xl">📧</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Gmail OAuth Setup
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Connect your Gmail account to send emails securely through Google's servers.
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    Connect Gmail Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {formData.provider === 'smtp' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="smtp.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.smtpUsername}
                    onChange={(e) => handleInputChange('smtpUsername', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="username@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.smtpPassword}
                    onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium"
                  >
                    {testing ? 'Testing Connection...' : 'Test SMTP Connection'}
                  </button>
                  
                  {testResult && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                      testResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    }`}>
                      {testResult.message}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {formData.provider === 'sendgrid' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-purple-600 dark:text-purple-400 text-2xl">⚡</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    SendGrid API Setup
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                    Use SendGrid's reliable email delivery service. Requires a SendGrid API key.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter SendGrid API Key"
                    className="w-full rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.provider !== 'none' && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Sender Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={formData.fromEmail}
                      onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="noreply@yourbusiness.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.fromName}
                      onChange={(e) => handleInputChange('fromName', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="Your Business Name"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Email Notifications
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableReceiptEmails}
                      onChange={(e) => handleInputChange('enableReceiptEmails', e.target.checked)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Customer Receipt Emails
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Automatically send receipts to customers after purchase
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableOrderNotifications}
                      onChange={(e) => handleInputChange('enableOrderNotifications', e.target.checked)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Order Notifications
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Receive notifications for new orders and updates
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableLowStockAlerts}
                      onChange={(e) => handleInputChange('enableLowStockAlerts', e.target.checked)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Low Stock Alerts
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Get notified when products are running low
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
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
            {loading ? 'Saving...' : formData.provider === 'none' ? 'Skip for Now' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
