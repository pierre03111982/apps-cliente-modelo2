/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de build
  swcMinify: true, // Usar SWC para minificação (mais rápido)
  compress: true, // Habilitar compressão
  
  // Remover console.log em produção
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Manter apenas erros e avisos
    } : false,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.firebasestorage.googleapis.com",
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'], // Formatos modernos
    minimumCacheTTL: 60, // Cache de 60 segundos
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
