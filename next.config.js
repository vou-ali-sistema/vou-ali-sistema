/** @type {import('next').NextConfig} */

// CSP mínima para rotas de checkout: Mercado Pago + inline controlado (apenas nessas rotas).
const cspCheckout =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://sdk.mercadopago.com https://www.mercadopago.com.br https://sandbox.mercadopago.com.br; " +
  "connect-src 'self' https://api.mercadopago.com https://sandbox.mercadopago.com.br; " +
  "frame-src 'self' https://www.mercadopago.com.br https://sandbox.mercadopago.com.br; " +
  "img-src 'self' data: blob: https:; " +
  "style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; " +
  "object-src 'none'; base-uri 'self'; form-action 'self';"

// CSP para o restante do site: permite scripts inline do Next.js/React (admin, comprar, etc.).
const cspStrict =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self'; " +
  "frame-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'self';"

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      // Canonicalizar domínio: redirecionar sem www -> com www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'blocovouali.com' }],
        destination: 'https://www.blocovouali.com/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      // CSP forte para todo o site (aplicada primeiro)
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspStrict },
        ],
      },
      // CSP com Mercado Pago no fluxo de compra: comprar, troca/pendente (retorno), checkout, review, redirect
      { source: '/comprar', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/comprar/:path*', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/troca/pendente', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/troca/pendente/:path*', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/checkout', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/checkout/:path*', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/review', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/review/:path*', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/redirect', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
      { source: '/redirect/:path*', headers: [{ key: 'Content-Security-Policy', value: cspCheckout }] },
    ]
  },
}

module.exports = nextConfig

