export const dynamic = 'force-static'
export const revalidate = false

export default function HomePage() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>
          Experimente AI - Modelo 1
        </h1>
        <p style={{ marginBottom: '8px', color: '#9CA3AF' }}>
          Acesse o aplicativo usando o link completo com o ID da loja:
        </p>
        <p style={{ fontSize: '14px', color: '#6B7280', wordBreak: 'break-all' }}>
          https://apps-cliente-modelo1.vercel.app/[lojistaId]/login
        </p>
        <div style={{ marginTop: '24px', fontSize: '12px', color: '#6B7280' }}>
          <p>Exemplo: https://apps-cliente-modelo1.vercel.app/seu-lojista-id/login</p>
        </div>
      </div>
    </div>
  )
}


