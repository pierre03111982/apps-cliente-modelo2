// Layout para rotas dinâmicas [lojistaId]
// Garante que todas as rotas dentro de [lojistaId] sejam renderizadas dinamicamente
export const dynamic = 'force-dynamic'

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

