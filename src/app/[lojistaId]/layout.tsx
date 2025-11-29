// Layout para rotas dinâmicas [lojistaId]
// Garante que todas as rotas dentro de [lojistaId] sejam renderizadas dinamicamente
import { Metadata } from 'next';
import { getFirestoreAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic'
export const dynamicParams = true

/**
 * PHASE 12: Generate Metadata dinâmico para SEO e Open Graph
 * Cria previews bonitos para WhatsApp/Social Media
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lojistaId: string }>
}): Promise<Metadata> {
  const { lojistaId } = await params;
  
  try {
    // Buscar dados da loja do Firestore
    const db = getFirestoreAdmin();
    const lojaDoc = await db.collection("lojas").doc(lojistaId).get();
    
    if (lojaDoc.exists) {
      const lojaData = lojaDoc.data();
      const nome = lojaData?.nome || "Loja";
      const descricao = lojaData?.descricao || "Experimente as roupas sem sair de casa";
      const logoUrl = lojaData?.logoUrl || null;
      
      // URL base do site
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_VERCEL_URL ? 
                     `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
                     'https://experimente.ai';
      
      // Imagem Open Graph (usar logo da loja ou imagem padrão)
      const ogImage = logoUrl || `${baseUrl}/og-default.jpg`;
      
      return {
        title: `${nome} | Provador Virtual com IA`,
        description: `Experimente as roupas da ${nome} sem sair de casa. ${descricao}. Tecnologia de Provador Virtual Inteligente.`,
        openGraph: {
          title: `${nome} | Provador Virtual com IA`,
          description: `Experimente as roupas da ${nome} sem sair de casa. Tecnologia de Provador Virtual Inteligente.`,
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `${nome} - Provador Virtual`,
            },
          ],
          type: 'website',
          siteName: nome,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${nome} | Provador Virtual com IA`,
          description: `Experimente as roupas da ${nome} sem sair de casa. Tecnologia de Provador Virtual Inteligente.`,
          images: [ogImage],
        },
      };
    }
  } catch (error) {
    console.error("[Layout] Erro ao buscar dados da loja para metadata:", error);
  }
  
  // Fallback metadata
  return {
    title: "Provador Virtual com IA | Experimente.ai",
    description: "Experimente roupas sem sair de casa. Tecnologia de Provador Virtual Inteligente.",
    openGraph: {
      title: "Provador Virtual com IA | Experimente.ai",
      description: "Experimente roupas sem sair de casa. Tecnologia de Provador Virtual Inteligente.",
      type: 'website',
    },
  };
}

export default async function LojistaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lojistaId: string }>;
}) {
  const { lojistaId } = await params;
  
  return (
    <>
      <link rel="manifest" href={`/${lojistaId}/manifest.json`} />
      {children}
    </>
  );
}

