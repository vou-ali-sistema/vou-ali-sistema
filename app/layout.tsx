import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Footer from './components/Footer'

export const metadata: Metadata = {
  title: 'Bloco Vou Ali - Sistema de Vendas',
  description: 'Sistema de vendas do Bloco Vou Ali',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

