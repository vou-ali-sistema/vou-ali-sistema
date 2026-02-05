/** @type {import('next').NextConfig} */

// CSP para rotas de checkout (Mercado Pago): mais permissiva para scripts/frames do MP.
const cspCheckout =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mercadopago.com.br https://sdk.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.br; " +
  "frame-src 'self' https://*.mercadopago.com.br https://*.mercadopago.com https://www.mercadopago.com.br https://www.mercadopago.com; " +
  "connect-src 'self' https://*.mercadopago.com https://*.mercadopago.com.br https://api.mercadopago.com https://sandbox.mercadopago.com.br https://sandbox.mercadopago.com; " +
  "img-src 'self' data: blob: https:; " +
  "style-src 'self' 'unsafe-inline' https://*.mercadopago.com https://*.mercadopago.com.br; " +
  "font-src 'self' data:; " +
  "object-src 'none'; base-uri 'self'; form-action 'self';"

// CSP forte para o restante do site (sem strict-dynamic/nonce que bloqueiam scripts do MP).
const cspStrict =
  "default-src 'self'; " +
  "script-src 'self'; " +
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
      // CSP permissiva SOMENTE nas rotas de checkout (permite Mercado Pago; sobrescreve CSP com nonce/strict-dynamic)
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

