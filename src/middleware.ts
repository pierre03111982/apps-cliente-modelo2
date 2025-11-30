import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para roteamento por subdomínio (Fase 11)
 * 
 * display.experimenteai.com.br/[lojistaId] -> /[lojistaId]/experimentar?display=1
 * app2.experimenteai.com.br/[lojistaId] -> /[lojistaId]/experimentar (normal)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Obter domínio de display das variáveis de ambiente
  const displayDomain = process.env.NEXT_PUBLIC_DISPLAY_DOMAIN || 'display.experimenteai.com.br'
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'app2.experimenteai.com.br'

  // Verificar se está acessando pelo subdomínio de display
  if (hostname.includes(displayDomain) || hostname === displayDomain) {
    // Se já tiver o parâmetro display=1, não fazer nada
    if (request.nextUrl.searchParams.has('display')) {
      return NextResponse.next()
    }

    // Se for a rota raiz do subdomínio, redirecionar para /experimentar?display=1
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/experimentar'
      url.searchParams.set('display', '1')
      return NextResponse.redirect(url)
    }

    // Se for uma rota [lojistaId], adicionar display=1
    // Exemplo: display.experimenteai.com.br/loja123 -> /loja123/experimentar?display=1
    const lojistaIdMatch = pathname.match(/^\/([^/]+)$/)
    if (lojistaIdMatch) {
      const lojistaId = lojistaIdMatch[1]
      const url = request.nextUrl.clone()
      url.pathname = `/${lojistaId}/experimentar`
      url.searchParams.set('display', '1')
      return NextResponse.redirect(url)
    }

    // Se já estiver em /[lojistaId]/experimentar, apenas adicionar display=1
    const experimentarMatch = pathname.match(/^\/([^/]+)\/experimentar$/)
    if (experimentarMatch) {
      const url = request.nextUrl.clone()
      url.searchParams.set('display', '1')
      return NextResponse.rewrite(url)
    }

    // Se estiver em qualquer outra rota com [lojistaId], adicionar display=1
    const url = request.nextUrl.clone()
    if (!url.searchParams.has('display')) {
      url.searchParams.set('display', '1')
    }
    return NextResponse.rewrite(url)
  }

  // Para app2.experimenteai.com.br ou outros domínios, comportamento normal
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}











