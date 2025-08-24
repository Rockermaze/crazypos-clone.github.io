import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

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

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
    async session({ session, token }: any) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          businessName: token.businessName
        }
      }
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.businessName = user.businessName
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/start'
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
