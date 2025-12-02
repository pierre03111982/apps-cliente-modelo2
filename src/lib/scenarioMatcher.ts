/**
 * PHASE 26: Scenario Tag Matching
 * 
 * Funções para buscar cenários baseados em tags de produtos.
 */

import { getFirestoreAdmin } from './firebaseAdmin';
import type { Produto } from './types';

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
  const db = getFirestoreAdmin();
  
  if (!db) {
    console.warn('[scenarioMatcher] Firestore Admin não disponível');
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
  let matchingScenarios: any[] = [];
  
  if (uniqueKeywords.length > 0) {
    // Firestore array-contains-any permite buscar documentos onde o array contém qualquer um dos valores
    // Mas precisamos fazer múltiplas queries ou usar uma estratégia diferente
    
    // Como Firestore não suporta array-contains-any diretamente em uma query,
    // vamos buscar cenários ativos e filtrar em memória (ou fazer múltiplas queries)
    
    try {
      // Buscar todos os cenários ativos
      const scenariosSnapshot = await db
        .collection('scenarios')
        .where('active', '==', true)
        .get();
      
      // Filtrar em memória: cenários que têm pelo menos uma tag em comum
      matchingScenarios = scenariosSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((scenario: any) => {
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
      
      console.log(`[scenarioMatcher] ${matchingScenarios.length} cenários encontrados por tags`);
    } catch (error: any) {
      console.error('[scenarioMatcher] Erro ao buscar cenários por tags:', error);
    }
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
    try {
      const categoryScenarios = await db
        .collection('scenarios')
        .where('active', '==', true)
        .where('category', '==', scenarioCategory)
        .get();
      
      if (!categoryScenarios.empty) {
        const scenarios = categoryScenarios.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        
        const randomScenario = scenarios[
          Math.floor(Math.random() * scenarios.length)
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
    } catch (error: any) {
      console.error('[scenarioMatcher] Erro ao buscar cenários por categoria:', error);
    }
  }
  
  // Estratégia 3: Fallback FINAL - Sortear um cenário aleatório de TODOS os cenários ativos
  // Nunca retornar null - sempre usar um cenário da lista
  console.log('[scenarioMatcher] Nenhum cenário encontrado por categoria. Sortando cenário aleatório de todos os disponíveis...');
  
  try {
    const allScenariosSnapshot = await db
      .collection('scenarios')
      .where('active', '==', true)
      .get();
    
    if (!allScenariosSnapshot.empty) {
      const allScenarios = allScenariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
      
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
  } catch (error: any) {
    console.error('[scenarioMatcher] Erro ao buscar cenários aleatórios:', error);
  }
  
  // Último recurso: retornar null (não deveria acontecer se há cenários no banco)
  console.warn('[scenarioMatcher] ⚠️ NENHUM cenário ativo encontrado no banco. Backend usará prompt genérico.');
  return null;
}


