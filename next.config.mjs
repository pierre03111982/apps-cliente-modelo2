/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
  // Garantir que a página raiz seja renderizada corretamente
  trailingSlash: false,
  // Desabilitar otimizações que podem causar problemas com rotas dinâmicas
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

export default nextConfig


