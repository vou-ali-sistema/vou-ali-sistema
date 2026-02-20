'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Logo from '@/app/components/Logo'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  useEffect(() => {
    setIsLocalhost(typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname))
    // Ler erro da URL (ex: ?error=CredentialsSignin)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'CredentialsSignin') {
        setError('Email ou senha inválidos')
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        senha,
        redirect: false,
        callbackUrl: '/admin',
      })
      if (result?.error) {
        setError('Email ou senha inválidos')
        return
      }
      if (result?.ok) {
        const session = await getSession()
        const role = (session?.user as { role?: string })?.role
        const url = role === 'TROCAS' ? '/admin/trocas' : '/admin'
        window.location.replace(url)
        return
      }
      setError('Email ou senha inválidos')
    } catch {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSenha() {
    setResetMsg('')
    try {
      const res = await fetch('/api/reset-admin-password')
      if (!res.ok) {
        let msg = `Erro ${res.status} ao redefinir senha`
        try {
          const data = await res.json()
          msg = data.erro || data.error || msg
        } catch {
          const text = await res.text().catch(() => '')
          if (text) msg = text
        }
        setResetMsg('Erro: ' + msg)
        return
      }
      const data = await res.json()
      if (data.ok) {
        setResetMsg('Senha redefinida! Use admin@vouali.com / admin123')
        setEmail('admin@vouali.com')
        setSenha('admin123')
      } else {
        setResetMsg('Erro: ' + (data.erro || 'tente novamente'))
      }
    } catch (e) {
      setResetMsg('Erro ao redefinir. Verifique se o servidor está rodando.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-green-600 to-yellow-400 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mx-auto">
        <div className="mb-6 text-center">
          <div className="inline-block mb-4">
            <Logo size="medium" showSubtitle={false} />
          </div>
          <p className="text-sm text-gray-600">Login - Painel Admin</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email ou usuário
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ex: admin@vouali.com ou vouali.trocas"
              className="w-full min-h-[48px] px-3 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full min-h-[48px] px-3 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {resetMsg && (
            <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              {resetMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-gradient-to-r from-green-600 to-blue-900 text-white py-3 px-4 rounded-lg active:from-green-700 active:to-blue-950 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-semibold mb-1">Perfil Trocas (portaria / lista de convidados)</p>
            <p>Login: <strong>vouali.trocas</strong> · Senha: <strong>112233</strong></p>
            <p className="mt-2 text-blue-700">Se der <strong>401 (Unauthorized)</strong>: o usuário ainda não existe no servidor. Abra no navegador (uma vez):</p>
            <p className="mt-1 font-mono text-xs break-all bg-white px-2 py-1 rounded border border-blue-200">
              https://www.blocovouali.com/api/setup-trocas-user?token=SEU_NEXTAUTH_SECRET
            </p>
            <p className="mt-1 text-blue-700">Troque <strong>SEU_NEXTAUTH_SECRET</strong> pelo valor da variável NEXTAUTH_SECRET na Vercel. Depois faça login de novo com vouali.trocas / 112233.</p>
          </div>

          {isLocalhost && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Problema para entrar no localhost?</p>
              <button
                type="button"
                onClick={handleResetSenha}
                className="min-h-[44px] text-sm text-blue-600 active:text-blue-800 font-medium underline touch-manipulation"
              >
                Redefinir senha do admin
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Padrão: admin@vouali.com / admin123
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

