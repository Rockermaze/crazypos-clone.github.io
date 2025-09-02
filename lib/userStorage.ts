// Mock user database - In production, use a real database
// This simulates a shared storage that persists during the server runtime

export interface User {
  id: string
  email: string
  password: string
  name: string
  businessName: string
}

// Initialize with demo user
let users: User[] = [
  {
    id: '1',
    email: 'demo@yourpos.com',
    password: 'demo123',
    name: 'Demo User',
    businessName: 'Demo Store'
  }
]

export function getUsers(): User[] {
  return users
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email === email)
}

export function findUserByCredentials(email: string, password: string): User | undefined {
  return users.find(user => user.email === email && user.password === password)
}

export function addUser(userData: Omit<User, 'id'>): User | null {
  // Check if user already exists
  if (findUserByEmail(userData.email)) {
    return null
  }

  const newUser: User = {
    id: (users.length + 1).toString(),
    ...userData
  }

  users.push(newUser)
  return newUser
}

export function getUserCount(): number {
  return users.length
}
