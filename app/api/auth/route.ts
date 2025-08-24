import { NextRequest, NextResponse } from 'next/server'

// Mock user data - In a real app, this would be in a database
const users = [
  {
    id: 1,
    email: 'demo@yourpos.com',
    password: 'demo123', // In real app, this would be hashed
    firstName: 'Demo',
    lastName: 'User',
    businessName: 'Demo Store'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    if (action === 'login') {
      const { email, password } = data
      
      const user = users.find(u => u.email === email && u.password === password)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // In a real app, you'd create a proper JWT token here
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName
      }

      return NextResponse.json({ 
        success: true, 
        user: userResponse,
        message: 'Login successful' 
      })
    }

    if (action === 'signup') {
      const { email, password, firstName, lastName, businessName } = data
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === email)
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      // Create new user
      const newUser = {
        id: users.length + 1,
        email,
        password, // In real app, hash this password
        firstName,
        lastName,
        businessName
      }
      
      users.push(newUser)

      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        businessName: newUser.businessName
      }

      return NextResponse.json({ 
        success: true, 
        user: userResponse,
        message: 'Account created successfully' 
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
