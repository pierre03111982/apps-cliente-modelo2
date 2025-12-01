import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para roteamento por subdomínio (Fase 11)
 * 
 * experimenteai.com.br -> redireciona para app2.experimenteai.com.br (301)
 * display.experimenteai.com.br/[lojistaId] -> /[lojistaId]/experimentar?display=1
 * app2.experimenteai.com.br/[lojistaId] -> /[lojistaId]/experimentar (normal)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Obter domínio de display das variáveis de ambiente
  const displayDomain = process.env.NEXT_PUBLIC_DISPLAY_DOMAIN || 'display.experimenteai.com.br'
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'app2.experimenteai.com.br'
  const rootDomain = 'experimenteai.com.br'

  // Redirecionar domínio raiz para app2
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    const protocol = request.nextUrl.protocol
    const newUrl = new URL(`${protocol}//${appDomain}${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(newUrl, 301) // 301 = permanente
  }

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

  // Limpar URLs malformadas: detectar padrões como números de telefone ou caracteres inválidos após lojistaId
  // Exemplo: /[lojistaId]/(48)%2098815-6098 -> /[lojistaId]/experimentar
  const malformedUrlMatch = pathname.match(/^\/([^/]+)\/([^/]+)/)
  if (malformedUrlMatch) {
    const lojistaId = malformedUrlMatch[1]
    const invalidSegment = malformedUrlMatch[2]
    
    // Verificar se o segmento inválido parece ser um número de telefone ou texto inválido
    // Padrões: números, parênteses, espaços codificados, etc.
    const phonePattern = /[\(\)\d\s%\-]+/i
    const isInvalidSegment = phonePattern.test(invalidSegment) && 
                             !['login', 'experimentar', 'resultado', 'tv', 'manifest.json'].includes(invalidSegment)
    
    if (isInvalidSegment) {
      // Redirecionar para a página correta do lojista
      const protocol = request.nextUrl.protocol
      const newUrl = new URL(`${protocol}//${hostname}/${lojistaId}/experimentar${request.nextUrl.search}`)
      return NextResponse.redirect(newUrl, 301)
    }
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
     * - images/ (static images from public folder)
     * - public/ (public folder assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/|public/).*)',
  ],
}













