// lib/auth.js - NextAuth configuration for YourPOS
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { findUserByCredentials } from '@/lib/userStorage'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

// Build providers list conditionally to avoid runtime errors when Google creds are missing
const providers = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  )
}

providers.push(
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      try {
        const user = await findUserByCredentials(credentials.email, credentials.password)

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            businessName: user.businessName,
          }
        }

        return null
      } catch (error) {
        console.error('Authentication error:', error)
        return null
      }
    },
  })
)

export const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          
          // Check if user already exists with this Google ID
          let existingUser = await User.findOne({ googleId: account.providerAccountId })
          
          if (!existingUser) {
            // Check if user exists with this email
            existingUser = await User.findOne({ email: user.email })
            
            if (existingUser) {
              // Link Google account to existing user
              existingUser.googleId = account.providerAccountId
              if (user.image) existingUser.image = user.image
              await existingUser.save()
            } else {
              // Create new user
              const newUser = await User.create({
                email: user.email,
                name: user.name || profile?.name || 'User',
                googleId: account.providerAccountId,
                image: user.image,
                businessName: user.name ? `${user.name}'s Store` : 'Your Store',
              })
              user.id = newUser._id.toString()
              user.businessName = newUser.businessName
            }
          } else {
            user.id = existingUser._id.toString()
            user.businessName = existingUser.businessName || 'Your Store'
          }
          
          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      
      // Allow credentials sign-in
      return true
    },
    async session({ session, token }) {
      if (token?.sub) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub,
            businessName: token.businessName || 'Your Store',
            image: token.picture,
          },
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.businessName = user.businessName || 'Your Store'
      }
      
      // For Google OAuth, fetch user data from DB to get businessName
      if (account?.provider === 'google' && token.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ 
            $or: [
              { googleId: account.providerAccountId },
              { email: token.email }
            ]
          })
          if (dbUser) {
            token.sub = dbUser._id.toString()
            token.businessName = dbUser.businessName || 'Your Store'
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }
      
      return token
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'yourpos.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'yourpos.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'yourpos.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: 'yourpos.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: 'yourpos.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    nonce: {
      name: 'yourpos.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'd6b3f2c9a1784e1f9572c3a4b5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
  debug: process.env.NODE_ENV === 'development',
}
