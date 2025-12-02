/**
 * PHASE 26: Scenario Tag Matching
 * PHASE 27: Cache em memória para cenários
 * 
 * Funções para buscar cenários baseados em tags de produtos.
 */

import { getFirestoreAdmin } from './firebaseAdmin';
import type { Produto } from './types';

/**
 * PHASE 27: Cache em memória para cenários
 * Armazena todos os cenários ativos para evitar queries repetidas ao Firestore
 */
interface CachedScenario {
  id: string;
  fileName?: string;
  imageUrl: string;
  lightingPrompt?: string;
  category: string;
  tags?: string[];
  active: boolean;
}

class ScenarioCache {
  private scenarios: CachedScenario[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private fetchPromise: Promise<void> | null = null;

  /**
   * Carrega cenários do Firestore se necessário
   */
  async loadScenarios(forceRefresh: boolean = false): Promise<void> {
    const now = Date.now();
    const isExpired = now - this.lastFetch > this.CACHE_TTL;

    // Se o cache está válido e não é refresh forçado, retornar
    if (!forceRefresh && !isExpired && this.scenarios.length > 0) {
      return;
    }

    // Se já há uma requisição em andamento, aguardar ela
    if (this.fetchPromise) {
      await this.fetchPromise;
      return;
    }

    // Criar nova requisição
    this.fetchPromise = this._fetchScenarios();
    await this.fetchPromise;
    this.fetchPromise = null;
  }

  private async _fetchScenarios(): Promise<void> {
    const db = getFirestoreAdmin();
    
    if (!db) {
      console.warn('[scenarioCache] Firestore Admin não disponível');
      return;
    }

    try {
      console.log('[scenarioCache] Carregando cenários do Firestore...');
      const scenariosSnapshot = await db
        .collection('scenarios')
        .where('active', '==', true)
        .get();

      this.scenarios = scenariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CachedScenario[];

      this.lastFetch = Date.now();
      console.log(`[scenarioCache] ✅ ${this.scenarios.length} cenários carregados no cache`);
    } catch (error: any) {
      console.error('[scenarioCache] Erro ao carregar cenários:', error);
      // Manter cache anterior se houver erro
      if (this.scenarios.length === 0) {
        throw error;
      }
    }
  }

  /**
   * Retorna todos os cenários do cache
   */
  getAllScenarios(): CachedScenario[] {
    return this.scenarios;
  }

  /**
   * Limpa o cache (útil para testes ou refresh manual)
   */
  clear(): void {
    this.scenarios = [];
    this.lastFetch = 0;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      count: this.scenarios.length,
      lastFetch: this.lastFetch,
      age: Date.now() - this.lastFetch,
      isExpired: Date.now() - this.lastFetch > this.CACHE_TTL,
    };
  }
}

// Instância singleton do cache
const scenarioCache = new ScenarioCache();

/**
 * Extrai keywords/tags de um produto baseado em nome, descrição e categoria
 */
export function extractProductKeywords(product: Produto): string[] {
  const keywords: string[] = [];
  
  // Normalizar e extrair do nome
  if (product.nome) {
    const nomeLower = product.nome.toLowerCase();
    // Palavras comuns de produtos
    const productWords = nomeLower
      .split(/[\s,\-\.]+/)
      .filter(word => word.length > 2) // Ignorar palavras muito curtas
      .map(word => word.trim());
    keywords.push(...productWords);
  }
  
  // Normalizar e extrair da categoria
  if (product.categoria) {
    const categoriaLower = product.categoria.toLowerCase();
    keywords.push(categoriaLower);
    // Também adicionar palavras individuais da categoria
    const categoriaWords = categoriaLower
      .split(/[\s,\-\.]+/)
      .filter(word => word.length > 2)
      .map(word => word.trim());
    keywords.push(...categoriaWords);
  }
  
  // Normalizar e extrair da descrição (se existir)
  if (product.obs) {
    const descLower = product.obs.toLowerCase();
    const descWords = descLower
      .split(/[\s,\-\.]+/)
      .filter(word => word.length > 3) // Descrição pode ter palavras mais longas
      .map(word => word.trim());
    keywords.push(...descWords);
  }
  
  // Remover duplicatas e normalizar
  const uniqueKeywords = Array.from(new Set(keywords))
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);
  
  return uniqueKeywords;
}

/**
 * Mapeia categoria de produto para categoria de cenário
 */
function mapProductCategoryToScenarioCategory(productCategory?: string | null): string | null {
  if (!productCategory) return null;
  
  const categoryLower = productCategory.toLowerCase();
  
  // Mapeamento de categorias de produtos para categorias de cenários
  const categoryMap: Record<string, string> = {
    'calçados': 'urban',
    'calcados': 'urban',
    'tênis': 'urban',
    'tenis': 'urban',
    'sneaker': 'urban',
    'sneakers': 'urban',
    'bota': 'winter',
    'botas': 'winter',
    'praia': 'beach',
    'biquini': 'beach',
    'maio': 'beach',
    'sunga': 'beach',
    'fitness': 'fitness',
    'academia': 'fitness',
    'yoga': 'fitness',
    'treino': 'fitness',
    'festa': 'party',
    'balada': 'party',
    'gala': 'party',
    'noite': 'party',
    'inverno': 'winter',
    'frio': 'winter',
    'social': 'social',
    'formal': 'social',
    'trabalho': 'social',
    'executivo': 'social',
    'natureza': 'nature',
    'campo': 'nature',
    'urbano': 'urban',
    'streetwear': 'urban',
  };
  
  // Buscar match exato ou parcial
  for (const [key, value] of Object.entries(categoryMap)) {
    if (categoryLower.includes(key)) {
      return value;
    }
  }
  
  // Fallback: retornar null para usar busca genérica
  return null;
}

/**
 * Busca cenários no Firestore baseado em tags de produtos
 * PHASE 27: Usa cache em memória para evitar queries repetidas
 * 
 * Estratégia:
 * 1. Tenta encontrar cenários que contenham qualquer tag dos produtos
 * 2. Se não encontrar, usa fallback para categoria mapeada
 * 3. Se ainda não encontrar, retorna null
 */
export async function findScenarioByProductTags(
  products: Produto[]
): Promise<{
  imageUrl: string;
  lightingPrompt: string;
  category: string;
} | null> {
  // PHASE 27: Carregar cenários do cache (ou do Firestore se necessário)
  await scenarioCache.loadScenarios();
  const allScenarios = scenarioCache.getAllScenarios();
  
  if (allScenarios.length === 0) {
    console.warn('[scenarioMatcher] Nenhum cenário disponível no cache');
    return null;
  }
  
  // Extrair todas as keywords de todos os produtos
  const allKeywords: string[] = [];
  for (const product of products) {
    const keywords = extractProductKeywords(product);
    allKeywords.push(...keywords);
  }
  
  // Remover duplicatas
  const uniqueKeywords = Array.from(new Set(allKeywords));
  
  console.log('[scenarioMatcher] Keywords extraídas dos produtos:', uniqueKeywords);
  
  // Estratégia 1: Buscar cenários que contenham qualquer uma das tags
  let matchingScenarios: CachedScenario[] = [];
  
  if (uniqueKeywords.length > 0) {
    // PHASE 27: Filtrar em memória usando cache (muito mais rápido que query ao Firestore)
    matchingScenarios = allScenarios.filter((scenario) => {
      if (!scenario.tags || !Array.isArray(scenario.tags)) {
        return false;
      }
      
      // Verificar se alguma keyword do produto está nas tags do cenário
      const scenarioTags = scenario.tags.map((t: string) => t.toLowerCase());
      return uniqueKeywords.some(keyword => 
        scenarioTags.some((tag: string) => 
          tag.includes(keyword) || keyword.includes(tag)
        )
      );
    });
    
    console.log(`[scenarioMatcher] ${matchingScenarios.length} cenários encontrados por tags (do cache)`);
  }
  
  // Se encontrou cenários por tags, escolher um aleatório
  if (matchingScenarios.length > 0) {
    const randomScenario = matchingScenarios[
      Math.floor(Math.random() * matchingScenarios.length)
    ];
    
    console.log('[scenarioMatcher] ✅ Cenário selecionado por tags:', {
      fileName: randomScenario.fileName,
      tags: randomScenario.tags,
      category: randomScenario.category,
    });
    
    return {
      imageUrl: randomScenario.imageUrl,
      lightingPrompt: randomScenario.lightingPrompt || '',
      category: randomScenario.category,
    };
  }
  
  // Estratégia 2: Fallback para categoria (usar categoria do PRIMEIRO produto quando há múltiplos)
  console.log('[scenarioMatcher] Nenhum cenário encontrado por tags. Tentando fallback por categoria...');
  
  // IMPORTANTE: Quando há múltiplos produtos, usar o cenário do PRIMEIRO produto adicionado
  // Pegar a primeira categoria de produto disponível (primeiro produto = products[0])
  const productCategory = products[0]?.categoria || null;
  const scenarioCategory = mapProductCategoryToScenarioCategory(productCategory);
  
  if (scenarioCategory) {
    // PHASE 27: Filtrar do cache em vez de query ao Firestore
    const categoryScenarios = allScenarios.filter(
      scenario => scenario.category === scenarioCategory
    );
    
    if (categoryScenarios.length > 0) {
      const randomScenario = categoryScenarios[
        Math.floor(Math.random() * categoryScenarios.length)
      ];
      
      console.log('[scenarioMatcher] ✅ Cenário selecionado por categoria (fallback) - primeiro produto:', {
        fileName: randomScenario?.fileName || 'N/A',
        category: randomScenario?.category || 'N/A',
        primeiroProduto: products[0]?.nome || 'N/A',
      });
      
      return {
        imageUrl: randomScenario?.imageUrl || '',
        lightingPrompt: randomScenario?.lightingPrompt || '',
        category: randomScenario?.category || '',
      };
    }
  }
  
  // Estratégia 3: Fallback FINAL - Sortear um cenário aleatório de TODOS os cenários ativos
  // Nunca retornar null - sempre usar um cenário da lista
  console.log('[scenarioMatcher] Nenhum cenário encontrado por categoria. Sortando cenário aleatório de todos os disponíveis...');
  
  if (allScenarios.length > 0) {
    const randomScenario = allScenarios[
      Math.floor(Math.random() * allScenarios.length)
    ];
    
    console.log('[scenarioMatcher] ✅ Cenário aleatório selecionado (fallback final):', {
      fileName: randomScenario?.fileName || 'N/A',
      category: randomScenario?.category || 'N/A',
      totalCenarios: allScenarios.length,
    });
    
    return {
      imageUrl: randomScenario?.imageUrl || '',
      lightingPrompt: randomScenario?.lightingPrompt || '',
      category: randomScenario?.category || '',
    };
  }
  
  // Último recurso: retornar null (não deveria acontecer se há cenários no banco)
  console.warn('[scenarioMatcher] ⚠️ NENHUM cenário ativo encontrado no cache. Backend usará prompt genérico.');
  return null;
}

/**
 * PHASE 27: Função auxiliar para forçar refresh do cache (útil para testes ou atualizações)
 */
export async function refreshScenarioCache(): Promise<void> {
  await scenarioCache.loadScenarios(true);
  console.log('[scenarioMatcher] Cache atualizado:', scenarioCache.getStats());
}


