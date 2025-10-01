import { NextResponse } from 'next/server'

// This route is intentionally disabled to avoid conflicts with NextAuth and the DB-backed register route.
// Use the following endpoints instead:
// - POST /api/auth/register        → Create an account (MongoDB via Mongoose)
// - /api/auth/[...nextauth]        → NextAuth handlers (credentials, Google, session)

export async function GET() {
  return NextResponse.json(
    {
      error: 'Endpoint moved',
      message: 'Use POST /api/auth/register for registration or NextAuth endpoints under /api/auth/[...nextauth] for auth.'
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint moved',
      message: 'Use POST /api/auth/register for registration or NextAuth endpoints under /api/auth/[...nextauth] for auth.'
    },
    { status: 410 }
  )
}
