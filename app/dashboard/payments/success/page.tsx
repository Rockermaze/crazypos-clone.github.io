'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function PaymentSetupSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/payments')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Payment Setup Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Congratulations! Your Stripe Connect account has been successfully set up. 
              You can now accept online payments from customers.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Share your payment link with customers</li>
                <li>✓ Process online transactions</li>
                <li>✓ Track payments in your dashboard</li>
                <li>✓ Receive automatic daily payouts</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => router.push('/dashboard/payments')}
                className="w-full"
              >
                Go to Payment Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-4">
              Redirecting to payment settings in 10 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}