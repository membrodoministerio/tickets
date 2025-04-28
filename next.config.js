/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
    // unoptimized: true // Removido para permitir que o plugin Netlify otimize as imagens
  }
}

module.exports = nextConfig