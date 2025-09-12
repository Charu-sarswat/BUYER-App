import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Demo credentials - in production, you'd validate against your database
        if (credentials?.email === 'demo@example.com' && credentials?.password === 'demo123') {
          // Create or find the demo user
          let user = await prisma.user.findUnique({
            where: { email: 'demo@example.com' }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: 'demo@example.com',
                name: 'Demo User',
                role: 'USER'
              }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        // Invalid credentials
        return null
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
  },
}
