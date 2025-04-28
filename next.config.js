/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  images: {
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Adiciona um fallback vazio para todos os módulos que não podem ser resolvidos
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Ignora módulos não encontrados
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };
    
    return config;
  },
  // Desativa a exportação estática para evitar problemas com rotas dinâmicas
  output: 'standalone',
  // Desativa a verificação de exportação estática
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: [],
  }
}

module.exports = nextConfig
