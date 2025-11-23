"use client"

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 80, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Anel externo com gradiente animado - roxo para verde */}
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent"
        style={{
          borderTopColor: '#6366f1',
          borderRightColor: '#9333ea',
          borderBottomColor: '#ec4899',
          borderLeftColor: '#22c55e',
          animation: 'spin 2s linear infinite',
        }}
      />
      
      {/* Anel médio com cores gradiente - velocidade média */}
      <div
        className="absolute inset-2 rounded-full border-4 border-transparent"
        style={{
          borderTopColor: '#22c55e',
          borderRightColor: '#6366f1',
          borderBottomColor: '#9333ea',
          borderLeftColor: '#ec4899',
          animation: 'spin 1.5s linear infinite',
        }}
      />
      
      {/* Anel interno reverso - velocidade rápida */}
      <div
        className="absolute inset-4 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: '#ec4899',
          borderRightColor: '#22c55e',
          borderBottomColor: '#6366f1',
          borderLeftColor: '#9333ea',
          animation: 'spin 1s linear infinite reverse',
        }}
      />
      
      {/* Centro com brilho radial gradiente */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(147, 51, 234, 0.2) 40%, transparent 70%)',
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

