"use client"

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 80, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Anel externo com gradiente animado */}
      <div
        className="absolute inset-0 rounded-full border-4 animate-spin"
        style={{
          borderImage: 'linear-gradient(45deg, #6366f1, #9333ea, #ec4899, #22c55e, #6366f1) 1',
          borderImageSlice: 1,
          animation: 'spin 2s linear infinite',
        }}
      />
      
      {/* Anel médio com cores gradiente */}
      <div
        className="absolute inset-2 rounded-full border-4 animate-spin"
        style={{
          borderTopColor: '#6366f1',
          borderRightColor: '#9333ea',
          borderBottomColor: '#ec4899',
          borderLeftColor: '#22c55e',
          animation: 'spin 1.5s linear infinite',
        }}
      />
      
      {/* Anel interno reverso */}
      <div
        className="absolute inset-4 rounded-full border-2 animate-spin"
        style={{
          borderTopColor: '#22c55e',
          borderRightColor: '#6366f1',
          borderBottomColor: '#9333ea',
          borderLeftColor: '#ec4899',
          animation: 'spin 1s linear infinite reverse',
        }}
      />
      
      {/* Centro com brilho radial */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
        }}
      />
      
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

