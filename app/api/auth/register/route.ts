import { NextRequest, NextResponse } from 'next/server'
import { addUser, findUserByEmail } from '@/lib/userStorage'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, businessName } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !businessName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const name = `${firstName} ${lastName}`
    const newUser = addUser({
      email,
      password, // In production, hash this password!
      name,
      businessName
    })

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Return success (don't send back password)
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        businessName: newUser.businessName
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
