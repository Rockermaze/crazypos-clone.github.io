import { NextResponse } from 'next/server'
import gateway from '@/lib/braintree'
import { getServerSession } from 'next-auth'

export async function GET(request) {
  try {
    // Require authentication to mint client tokens
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Optional: allow vault-aware token by passing a customerId (if you map users to BT customers)
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || undefined

    const result = await gateway.clientToken.generate({
      ...(customerId ? { customerId } : {}),
    })

    return NextResponse.json({ success: true, clientToken: result.clientToken })
  } catch (e) {
    // Avoid leaking secrets; emit concise error and log server-side details
    console.error('Braintree clientToken error:', e)
    const isMissingEnv = /Missing required env var/i.test(String(e?.message || ''))
    const msg = isMissingEnv ? 'Server configuration incomplete for Braintree' : 'Failed to create client token'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
