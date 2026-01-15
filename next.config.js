/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
}

module.exports = nextConfig

