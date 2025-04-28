/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
    unoptimized: true
  },
  // Desativar verificação de TypeScript temporariamente
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorar erros de ESLint temporariamente
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar erros de webpack temporariamente
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false };
    return config;
  }
}

module.exports = nextConfig
