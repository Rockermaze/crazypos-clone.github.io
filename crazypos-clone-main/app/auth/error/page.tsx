'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/Container'
import { Section } from '@/components/Section'

const errorMessages: { [key: string]: string } = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign in link is no longer valid. It may have been used already or it may have expired.',
  Default: 'An error occurred during authentication.'
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <Section>
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-extrabold text-slate-900">Authentication Error</h1>
            <p className="mt-2 text-slate-600">{errorMessage}</p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/auth/login"
              className="block w-full rounded-xl bg-brand-700 px-4 py-3 text-white font-semibold hover:bg-brand-500"
            >
              Try Again
            </Link>
            
            <Link 
              href="/"
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 font-medium hover:bg-slate-50"
            >
              Back to Home
            </Link>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-slate-100 rounded-xl">
              <p className="text-xs text-slate-500">Error code: {error}</p>
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
