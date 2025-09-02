import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'

// Mock user database - In production, use a real database
const users = [
  {
    id: '1',
    email: 'demo@yourpos.com',
    password: 'demo123',
    name: 'Demo User',
    businessName: 'Demo Store'
  }
]

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = users.find(
          u => u.email === credentials.email && u.password === credentials.password
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            businessName: user.businessName
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all sign-ins for Google and credentials
      return true
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          businessName: token.businessName || 'Your Store'
        }
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.businessName = user.businessName || 'Your Store'
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
