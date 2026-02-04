import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Em produção (Vercel), isso precisa estar definido para JWT/session funcionar.
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const senha = (credentials?.senha ?? credentials?.password)?.trim()
          if (!credentials?.email || !senha) {
            console.log('[Auth] Falta email ou senha nos credentials')
            return null
          }

          const email = credentials.email.trim().toLowerCase()
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
          })

          if (!user) {
            console.log('[Auth] Usuário não encontrado:', email)
            return null
          }
          if (!user.active) {
            console.log('[Auth] Usuário inativo:', email)
            return null
          }

          const senhaValida = await bcrypt.compare(senha, user.passwordHash)
          if (!senhaValida) {
            console.log('[Auth] Senha inválida para:', email)
            return null
          }

          console.log('[Auth] Login OK:', email)
            return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (err) {
          console.error('[Auth] Erro no authorize:', err)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string | null
        session.user.role = token.role as string
      }
      return session
    },
  },
}

