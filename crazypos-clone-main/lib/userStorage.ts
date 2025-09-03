import connectDB from './mongodb'
import UserModel, { IUser } from '../models/User'

export interface User {
  id: string
  email: string
  password?: string
  name: string
  businessName: string
  createdAt?: Date
  updatedAt?: Date
}

// Convert MongoDB user to our User interface
function mongoUserToUser(mongoUser: any): User {
  return {
    id: mongoUser._id.toString(),
    email: mongoUser.email,
    name: mongoUser.name,
    businessName: mongoUser.businessName,
    createdAt: mongoUser.createdAt,
    updatedAt: mongoUser.updatedAt
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    await connectDB()
    const users = await UserModel.find({}).select('-password')
    return users.map(mongoUserToUser)
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    await connectDB()
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('-password')
    return user ? mongoUserToUser(user) : null
  } catch (error) {
    console.error('Error finding user by email:', error)
    return null
  }
}

export async function findUserByCredentials(email: string, password: string): Promise<User | null> {
  try {
    await connectDB()
    const user = await UserModel.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return null
    }

    // Compare password using the schema method
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return null
    }

    return mongoUserToUser(user)
  } catch (error) {
    console.error('Error validating user credentials:', error)
    return null
  }
}

export async function addUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User | null> {
  try {
    await connectDB()
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email.toLowerCase() })
    if (existingUser) {
      return null
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const newUser = new UserModel({
      email: userData.email.toLowerCase(),
      password: userData.password,
      name: userData.name,
      businessName: userData.businessName
    })

    const savedUser = await newUser.save()
    return mongoUserToUser(savedUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function getUserCount(): Promise<number> {
  try {
    await connectDB()
    return await UserModel.countDocuments()
  } catch (error) {
    console.error('Error counting users:', error)
    return 0
  }
}
