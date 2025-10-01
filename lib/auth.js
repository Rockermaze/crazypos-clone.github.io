// lib/auth.js - NextAuth configuration for YourPOS
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { findUserByCredentials } from '@/lib/userStorage'

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
    async signIn() {
      // Allow all sign-ins for Google and credentials
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
          },
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.businessName = user.businessName || 'Your Store'
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
  },
  secret: process.env.NEXTAUTH_SECRET || 'd6b3f2c9a1784e1f9572c3a4b5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
  debug: process.env.NODE_ENV === 'development',
}
