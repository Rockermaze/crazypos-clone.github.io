'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ExternalLink,
  Refresh
} from 'lucide-react'

interface StripeAccount {
  hasAccount: boolean
  accountId?: string
  status: 'not_created' | 'pending' | 'active' | 'restricted' | 'error'
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirements?: any
  businessProfile?: any
}

export default function PaymentsDashboard() {
  const { data: session } = useSession()
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchStripeAccount()
    }
  }, [session])

  const fetchStripeAccount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/connect')
      const data = await response.json()
      
      if (response.ok) {
        setStripeAccount(data)
      } else {
        console.error('Error fetching stripe account:', data.error)
      }
    } catch (error) {
      console.error('Error fetching stripe account:', error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: 'US',
          businessType: 'individual'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        await fetchStripeAccount() // Refresh account status
        alert('Stripe account created successfully! Please complete the onboarding process.')
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating stripe account:', error)
      alert('Failed to create Stripe account')
    } finally {
      setActionLoading(false)
    }
  }

  const createOnboardingLink = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/payments/success`,
          refreshUrl: `${window.location.origin}/dashboard/payments`
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating onboarding link:', error)
      alert('Failed to create onboarding link')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'restricted':
        return <Badge className="bg-red-500 hover:bg-red-600"><AlertCircle className="w-3 h-3 mr-1" />Restricted</Badge>
      case 'not_created':
        return <Badge variant="outline"><CreditCard className="w-3 h-3 mr-1" />Not Set Up</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <Button 
          onClick={fetchStripeAccount} 
          variant="outline" 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Refresh className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {!stripeAccount?.hasAccount ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Set Up Payment Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to set up a Stripe Connect account to start accepting online payments from customers.
                This will allow customers to pay you directly while we handle a small platform fee.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <h3 className="font-semibold">What you'll get:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Accept credit card and digital payments</li>
                <li>Automatic daily payouts to your bank account</li>
                <li>Real-time transaction tracking</li>
                <li>Secure payment processing</li>
                <li>Customer receipt management</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button 
                onClick={createStripeAccount}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? 'Creating Account...' : 'Set Up Payment Processing'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Account Status
                </div>
                {getStatusBadge(stripeAccount.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">
                    {stripeAccount.chargesEnabled ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Accept Payments</div>
                  <div className="text-xs mt-1">
                    {stripeAccount.chargesEnabled ? 'Enabled' : 'Pending'}
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg">
                    {stripeAccount.payoutsEnabled ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Receive Payouts</div>
                  <div className="text-xs mt-1">
                    {stripeAccount.payoutsEnabled ? 'Enabled' : 'Pending'}
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Platform Fee</div>
                  <div className="text-xs mt-1">1.5%</div>
                </div>
              </div>

              {stripeAccount.status === 'pending' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your payment account is pending verification. Complete the onboarding process to start accepting payments.
                  </AlertDescription>
                </Alert>
              )}

              {stripeAccount.status === 'restricted' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your account has restrictions. Please complete any required information or contact support.
                  </AlertDescription>
                </Alert>
              )}

              {stripeAccount.status !== 'active' && (
                <div className="pt-4">
                  <Button 
                    onClick={createOnboardingLink}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {actionLoading ? 'Creating Link...' : 'Complete Account Setup'}
                  </Button>
                </div>
              )}

              {stripeAccount.status === 'active' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    🎉 Your payment processing is fully set up! You can now accept online payments from customers.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {stripeAccount.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Links & Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Your Payment URL</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      Share this link with customers for payments
                    </div>
                    <code className="text-xs bg-gray-100 p-2 rounded block">
                      {window.location.origin}/pay/{stripeAccount.accountId}
                    </code>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">API Integration</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      Use these details for custom integrations
                    </div>
                    <div className="text-xs space-y-1">
                      <div>Account ID: <code className="bg-gray-100 px-1 rounded">{stripeAccount.accountId}</code></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}