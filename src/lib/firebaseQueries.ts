import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"
import { getFirestoreClient, isFirebaseConfigured } from "./firebase"
import type { LojistaData, Produto } from "./types"
import { PRODUTOS_TESTE } from "./produtosTeste"

const produtosCollectionPath = (lojistaId: string) => {
  const db = getFirestoreClient()
  if (!db) return null
  return collection(db, "lojas", lojistaId, "produtos")
}

export async function fetchLojistaData(
  lojistaId: string
): Promise<LojistaData | null> {
  console.log("[fetchLojistaData] Iniciando busca para lojistaId:", lojistaId)

  // TENTATIVA 1: Buscar via API Proxy do Next.js (para evitar erro de permissão do Firestore Client e CORS)
  try {
    // Usar a rota proxy do próprio Next.js em vez de acessar o backend diretamente
    // Isso evita problemas de CORS e funciona tanto em desenvolvimento quanto em produção
    const apiUrl = typeof window !== 'undefined' 
      ? '/api/lojista/perfil'  // No cliente, usar rota relativa
      : (process.env.NEXT_PUBLIC_CLIENT_APP_URL || process.env.NEXT_PUBLIC_CLIENT_APP_DEV_URL || 'http://localhost:3005') + '/api/lojista/perfil'; // No servidor, usar URL completa
    
    const url = `${apiUrl}?lojistaId=${encodeURIComponent(lojistaId)}`;
    
    console.log(`[fetchLojistaData] Tentando buscar via API Proxy: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Evitar cache
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[fetchLojistaData] Dados recebidos da API:", data);
      
      // Verificar se há erro na resposta
      if (data?.error) {
        console.warn("[fetchLojistaData] API retornou erro:", data.error);
        throw new Error(data.error);
      }
      
      if (data && (data.nome || data.descricao)) {
        console.log("[fetchLojistaData] ✅ Dados válidos encontrados:", {
          nome: data.nome,
          hasLogo: !!data.logoUrl,
          lojistaId
        });
        return {
          id: lojistaId,
          nome: data.nome || "Loja",
          logoUrl: data.logoUrl || null,
          descricao: data.descricao || null,
          redesSociais: {
            instagram: data.instagram || null,
            facebook: data.facebook || null,
            tiktok: data.tiktok || null,
          },
          salesConfig: data.salesConfig || {},
          descontoRedesSociais: data.descontoRedesSociais || null,
          descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
          // appModel não é usado diretamente no frontend do modelo 2, mas está disponível se precisar
        };
      } else {
        console.warn("[fetchLojistaData] Resposta da API não contém dados válidos:", data);
      }
    } else {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.warn("[fetchLojistaData] API retornou erro:", response.status, errorText);
    }
  } catch (apiError: any) {
    console.error("[fetchLojistaData] Erro ao buscar da API:", apiError);
    console.error("[fetchLojistaData] Tipo do erro:", apiError?.name);
    console.error("[fetchLojistaData] Mensagem:", apiError?.message);
    // Não lançar erro aqui, deixar tentar Firebase como fallback
  }

  // TENTATIVA 2: Fallback para Firestore Client (código original)
  console.log("[fetchLojistaData] Fallback para Firestore Client...");
  
  if (!isFirebaseConfigured) {
    console.warn("[fetchLojistaData] Firebase não configurado!")
    return null
  }

  try {
    const db = getFirestoreClient()
    if (!db) {
      console.warn("[fetchLojistaData] Firestore não disponível")
      return null
    }

    const lojistaDoc = await getDoc(doc(db, "lojas", lojistaId))
    
    if (lojistaDoc.exists()) {
      const data = lojistaDoc.data()
      console.log("[fetchLojistaData] ✅ Dados encontrados no Firestore:", data.nome)
      return {
        id: lojistaId,
        nome: data.nome || "Loja",
        logoUrl: data.logoUrl || null,
        descricao: data.descricao || null,
        redesSociais: {
          instagram: data.instagram || data.redesSociais?.instagram || null,
          facebook: data.facebook || data.redesSociais?.facebook || null,
          tiktok: data.tiktok || data.redesSociais?.tiktok || null,
          whatsapp: data.whatsapp || data.redesSociais?.whatsapp || null,
        },
        salesConfig: data.salesConfig || {
          whatsappLink: data.salesWhatsapp || null,
          ecommerceUrl: data.checkoutLink || null,
        },
        descontoRedesSociais: data.descontoRedesSociais || null,
        descontoRedesSociaisExpiraEm: data.descontoRedesSociaisExpiraEm || null,
      }
    }
    
    console.warn("[fetchLojistaData] Loja não encontrada no Firestore")
    return null

  } catch (error: any) {
     console.error("[fetchLojistaData] Erro no fallback:", error);
    return null
  }
}

export async function fetchProdutos(
  lojistaId: string,
  opts?: { categoria?: string; limite?: number }
): Promise<Produto[]> {
  let produtos: Produto[] = []

  // Tentar buscar do Firestore se configurado
  if (isFirebaseConfigured) {
    try {
      const baseCollection = produtosCollectionPath(lojistaId)
      if (baseCollection) {
        const filtros = [] as any[]

        if (opts?.categoria) {
          filtros.push(where("categoria", "==", opts.categoria))
        }

        let produtosQuery = query(baseCollection, ...filtros)

        if (opts?.limite) {
          produtosQuery = query(produtosQuery, limit(opts.limite))
        }

        const snapshot = await getDocs(produtosQuery)

        produtos = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          const imagemUrlCatalogo =
            typeof data.imagemUrlCatalogo === "string" ? data.imagemUrlCatalogo : null
          const imagemUrlOriginal =
            typeof data.imagemUrlOriginal === "string" ? data.imagemUrlOriginal : null
          const descontoEspecialRaw = data.descontoProduto
          let descontoEspecial: number | null = null
          if (typeof descontoEspecialRaw === "number") {
            descontoEspecial = descontoEspecialRaw
          } else if (typeof descontoEspecialRaw === "string") {
            const parsed = parseFloat(descontoEspecialRaw.replace(",", "."))
            descontoEspecial = isNaN(parsed) ? null : parsed
          }

          return {
            id: docSnapshot.id,
            nome: typeof data.nome === "string" ? data.nome : "Produto",
            preco: typeof data.preco === "number" ? data.preco : null,
            imagemUrl:
              imagemUrlCatalogo ||
              (typeof data.imagemUrl === "string" ? data.imagemUrl : null),
            imagemUrlCatalogo,
            imagemUrlOriginal:
              imagemUrlOriginal ||
              (typeof data.imagemUrl === "string" ? data.imagemUrl : null),
            categoria: typeof data.categoria === "string" ? data.categoria : null,
            tamanhos: Array.isArray(data.tamanhos) ? (data.tamanhos as string[]) : [],
            cores: Array.isArray(data.cores) ? (data.cores as string[]) : [],
            medidas: typeof data.medidas === "string" ? data.medidas : undefined,
            estoque: typeof data.estoque === "number" ? data.estoque : null,
            obs: typeof data.obs === "string" ? data.obs : undefined,
            descontoProduto: descontoEspecial,
          }
        })
      }
    } catch (error: any) {
      // Se for erro de permissão, logar mas não quebrar o fluxo
      if (error?.code === "permission-denied" || error?.message?.includes("permission")) {
        console.warn("[fetchProdutos] Erro de permissão do Firestore:", error.message)
      } else {
        console.error("[fetchProdutos] Erro ao buscar produtos:", error)
      }
    }
  }

  // Se não encontrou produtos no Firestore, usar produtos de teste
  if (produtos.length === 0) {
    console.log("[fetchProdutos] Nenhum produto encontrado no Firestore. Usando produtos de teste.")
    produtos = [...PRODUTOS_TESTE]
  }

  // Aplicar filtro de categoria se especificado e usando produtos de teste
  if (opts?.categoria && produtos.length > 0 && produtos[0].id?.startsWith("produto-teste")) {
    produtos = produtos.filter((p) => p.categoria === opts.categoria)
  }

  // Aplicar limite se especificado
  if (opts?.limite && produtos.length > opts.limite) {
    produtos = produtos.slice(0, opts.limite)
  }

  return produtos
}
