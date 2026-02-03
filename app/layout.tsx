import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import Footer from './components/Footer'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bloco Vou Ali',
  description: 'Bloco Vou Ali – 11 anos de história e energia de Carnaval.',
  openGraph: {
    title: 'Bloco Vou Ali',
    description: 'Bloco Vou Ali – 11 anos de história, alegria e Carnaval.',
    url: 'https://www.blocovouali.com/',
    siteName: 'Bloco Vou Ali',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bloco Vou Ali',
    description: 'Bloco Vou Ali – 11 anos de história, alegria e Carnaval.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`min-h-screen flex flex-col ${inter.className}`}>
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

