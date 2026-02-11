/**
 * PHASE 26: Scenario Import Script (Versão Simplificada)
 * 
 * Versão que evita importações problemáticas
 */

console.log('🚀 Script iniciando...');

// Carregar .env.local se existir
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line: string) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ .env.local carregado');
  }
} catch (e) {
  console.log('⚠️  Erro ao carregar .env.local');
}

console.log('🔍 Verificando variáveis de ambiente...');
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

console.log(`   FIREBASE_PROJECT_ID: ${hasProjectId ? '✅' : '❌'}`);
console.log(`   FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅' : '❌'}`);
console.log(`   FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅' : '❌'}`);

if (!hasProjectId || !hasClientEmail || !hasPrivateKey) {
  console.error('\n❌ ERRO: Variáveis de ambiente Firebase não configuradas!');
  console.error('   Configure as variáveis no arquivo .env.local');
  process.exit(1);
}

console.log('\n✅ Variáveis OK! Continuando...\n');

// Agora importar Firebase (depois de verificar variáveis)
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

console.log('✅ Módulos importados\n');

// Inicializar Firebase
if (!getApps().length) {
  console.log('🔧 Inicializando Firebase...');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  console.log('✅ Firebase inicializado\n');
}

const db = getFirestore();
const storage = getStorage();
const bucket = storage.bucket();

console.log('🚀 Iniciando importação de cenários...\n');

// Continuar com a lógica de importação...
const csvPath = join(process.cwd(), 'public', 'images', 'scenarios_upload', 'scenarios_data.csv');
const imagesDir = join(process.cwd(), 'public', 'images', 'scenarios_upload');

console.log(`📄 CSV: ${csvPath}`);
console.log(`🖼️  Imagens: ${imagesDir}\n`);

if (!existsSync(csvPath)) {
  console.error(`❌ Erro: Arquivo CSV não encontrado: ${csvPath}`);
  process.exit(1);
}

if (!existsSync(imagesDir)) {
  console.error(`❌ Erro: Diretório de imagens não encontrado: ${imagesDir}`);
  process.exit(1);
}

console.log('✅ Arquivos encontrados!');
console.log('⚠️  Esta é uma versão simplificada. Para importação completa, use import-scenarios.ts\n');


