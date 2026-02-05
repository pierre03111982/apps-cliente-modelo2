export type SocialLinks = {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  [key: string]: string | undefined
}

export type SalesIntegrations = {
  melhor_envio_token?: string
  mercadopago_public_key?: string
  mercadopago_access_token?: string
}

export type SalesConfig = {
  enabled: boolean
  payment_gateway: "mercadopago" | "manual_whatsapp"
  shipping_provider: "melhor_envio" | "fixed_price" | "none"
  origin_zip?: string | null
  manual_contact?: string | null
  fixed_shipping_price?: number | null
  checkout_url?: string | null
  integrations?: SalesIntegrations
  // Campos legados / fallback
  whatsappLink?: string
  ecommerceUrl?: string
  salesWhatsapp?: string
  checkoutLink?: string
}

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string | null
}

export type Produto = {
  id: string
  nome: string
  preco?: number | null
  imagemUrl?: string | null
  imagemUrlCatalogo?: string | null
  imagemUrlOriginal?: string | null
  /** URLs das fotos do catálogo (frente, costas, extras) para galeria no detalhe */
  catalogImageUrls?: string[] | null
  categoria?: string | null
  tamanhos?: string[]
  cores?: string[]
  medidas?: string
  estoque?: number | null
  obs?: string
  descontoProduto?: number | null
  dimensions?: {
    weight_kg: number
    height_cm: number
    width_cm: number
    depth_cm: number
  }
  sku?: string
  stock_quantity?: number
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
  desativado?: boolean
}

export interface LojistaFinancials {
  credits_balance: number
  overdraft_limit: number
  plan_tier: "micro" | "growth" | "enterprise"
  billing_status: "active" | "frozen"
}

export type DislikeReason =
  | "garment_style"
  | "fit_issue"
  | "ai_distortion"
  | "other"

export interface UserAction {
  id: string
  user_id: string
  lojista_id: string
  product_id: string
  composition_id: string
  type: "like" | "dislike"
  reason?: DislikeReason
  timestamp: number
}

export interface StoreTheme {
  layout_mode: "minimal" | "bold" | "classic"
  primary_color: string
  logo_url: string
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
  displayOrientation?: "horizontal" | "vertical" | null
  produtos?: Produto[]
  financials?: LojistaFinancials
  theme?: StoreTheme
  is_sandbox_mode?: boolean
}

export interface UserProfile {
  uid: string
  phone_number: string
  privacy_mode: "public" | "private"
  marketing_consent: boolean
  preferred_avatar_id: string
  stats: {
    last_active: number
    total_generations: number
    liked_products: string[]
    disliked_products_style: string[]
    disliked_products_fit: string[]
  }
}

/**
 * PHASE 27: Tipos para Sistema de Jobs Assíncronos
 */
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"

export interface GenerationJob {
  id: string
  lojistaId: string
  customerId?: string
  customerName?: string
  status: JobStatus
  reservationId: string // ID da reserva de crédito
  createdAt: Date | FirebaseFirestore.Timestamp
  startedAt?: Date | FirebaseFirestore.Timestamp
  completedAt?: Date | FirebaseFirestore.Timestamp
  failedAt?: Date | FirebaseFirestore.Timestamp
  error?: string
  errorDetails?: any
  
  // Dados da geração
  personImageUrl: string
  productIds: string[]
  productUrl?: string
  scenePrompts?: string[]
  options?: any
  
  // Resultado (preenchido quando status = COMPLETED)
  result?: {
    compositionId?: string
    imageUrl?: string
    sceneImageUrls?: string[]
    totalCost?: number
    processingTime?: number
  }
  
  // Métricas
  apiCost?: number // Custo da API (sempre registrado)
  viewedAt?: Date | FirebaseFirestore.Timestamp // Quando o usuário visualizou
  creditCommitted?: boolean // Se o crédito foi debitado
  
  // PHASE 27: Retry logic
  retryCount?: number // Número de tentativas de reprocessamento
  maxRetries?: number // Número máximo de retries
}
