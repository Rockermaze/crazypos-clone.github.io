'use client'
import { useState } from 'react'
import { Modal } from '@/components/Modal'

interface PaymentSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface PaymentData {
  stripeConnectId: string
  enableCreditCard: boolean
  enableDebitCard: boolean
  enableDigitalWallets: boolean
  enableBankTransfer: boolean
  enableCash: boolean
  platformFeePercentage: number
  currency: string
  acceptTerms: boolean
}

export function PaymentSettingsModal({ isOpen, onClose, onComplete }: PaymentSettingsModalProps) {
  const [formData, setFormData] = useState<PaymentData>({
    stripeConnectId: '',
    enableCreditCard: true,
    enableDebitCard: true,
    enableDigitalWallets: true,
    enableBankTransfer: false,
    enableCash: true,
    platformFeePercentage: 1.5,
    currency: 'AUD',
    acceptTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [error, setError] = useState('')
  const [stripeConnected, setStripeConnected] = useState(false)

  const handleInputChange = (field: keyof PaymentData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Simulate Stripe Connect onboarding
  const handleStripeConnect = async () => {
    setConnectingStripe(true)
    setError('')
    
    try {
      // In a real implementation, you would:
      // 1. Create a Stripe Connect account
      // 2. Generate an onboarding link
      // 3. Open the Stripe onboarding flow
      // 4. Handle the callback
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful connection
      const mockStripeAccountId = `acct_${Math.random().toString(36).substr(2, 9)}`
      setFormData(prev => ({ ...prev, stripeConnectId: mockStripeAccountId }))
      setStripeConnected(true)
      
    } catch (error) {
      setError('Failed to connect to Stripe. Please try again.')
    } finally {
      setConnectingStripe(false)
    }
  }

  const validateForm = () => {
    if (!stripeConnected && !formData.stripeConnectId) {
      return 'Please connect your Stripe account to accept online payments'
    }
    if (!formData.acceptTerms) {
      return 'You must accept the terms and conditions'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Here you would save the payment settings to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mark this task as completed
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'paymentSettings',
          completed: true
        })
      })

      onComplete()
      onClose()
    } catch (error) {
      setError('Failed to save payment settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Settings">
      <div className="space-y-6">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Configure your payment methods to start accepting payments from customers.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stripe Connect Section */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Online Payments (Stripe)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Accept credit cards, debit cards, and digital wallets
              </p>
            </div>
            <div className="text-2xl">💳</div>
          </div>

          {!stripeConnected && !formData.stripeConnectId ? (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Stripe Connect Benefits:</strong>
                    <ul className="mt-1 space-y-1 ml-4">
                      <li>• Accept payments directly into your bank account</li>
                      <li>• 2.9% + 30¢ per transaction (industry standard)</li>
                      <li>• Automatic fraud protection</li>
                      <li>• PCI compliance included</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleStripeConnect}
                disabled={connectingStripe}
                className="w-full bg-[#635bff] hover:bg-[#524add] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {connectingStripe ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connecting to Stripe...
                  </div>
                ) : (
                  'Connect with Stripe'
                )}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-green-600 dark:text-green-400">✅</div>
                <div className="text-sm text-green-800 dark:text-green-200">
                  <strong>Stripe Connected!</strong> You can now accept online payments.
                  <br />
                  <span className="text-xs opacity-75">Account ID: {formData.stripeConnectId}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Accepted Payment Methods
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableCreditCard}
                onChange={(e) => handleInputChange('enableCreditCard', e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Credit Cards</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Visa, Mastercard, Amex</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableDebitCard}
                onChange={(e) => handleInputChange('enableDebitCard', e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Debit Cards</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">PIN and signature</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableDigitalWallets}
                onChange={(e) => handleInputChange('enableDigitalWallets', e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Digital Wallets</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Apple Pay, Google Pay</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableBankTransfer}
                onChange={(e) => handleInputChange('enableBankTransfer', e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Bank Transfer</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">ACH, wire transfers</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableCash}
                onChange={(e) => handleInputChange('enableCash', e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Cash</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Physical cash payments</div>
              </div>
            </label>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Business Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                disabled
              >
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Platform Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.platformFeePercentage}
                onChange={(e) => handleInputChange('platformFeePercentage', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Additional fee charged on top of Stripe's fees
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded mt-0.5"
            />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              I accept the{' '}
              <a href="#" className="text-brand-600 hover:text-brand-500 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-brand-600 hover:text-brand-500 underline">
                Privacy Policy
              </a>{' '}
              for payment processing. I understand that Stripe will process payments on behalf of my business.
            </div>
          </label>
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