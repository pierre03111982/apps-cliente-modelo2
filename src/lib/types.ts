export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesConfig = {
  whatsappLink?: string
  ecommerceUrl?: string
  [key: string]: string | undefined
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  imagemUrlCatalogo?: string | null
  imagemUrlOriginal?: string | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
  descontoProduto?: number | null
}

export type GeneratedLook = {
  id: string
  titulo: string
  descricao?: string
  imagemUrl: string
  produtoNome: string
  produtoPreco?: number | null
  watermarkText?: string
  compositionId?: string | null
  jobId?: string | null
  downloadUrl?: string | null
  customerName?: string | null
  desativado?: boolean // Flag para identificar looks desativados
}

export type LojistaData = {
  id: string
  nome: string
  logoUrl?: string | null
  descricao?: string | null
  redesSociais: SocialLinks
  salesConfig: SalesConfig
  descontoRedesSociais?: number | null
  descontoRedesSociaisExpiraEm?: string | null
  produtos?: Produto[]
}

