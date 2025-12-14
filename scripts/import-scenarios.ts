/**
 * PHASE 26: Scenario Import Script
 * 
 * Importa cenários do CSV para o Firestore com tags de produtos.
 * 
 * Uso:
 *   npx tsx scripts/import-scenarios.ts
 * 
 * Requisitos:
 *   - Arquivo CSV em: public/images/scenarios_upload/scenarios_data.csv
 *   - Imagens em: public/images/scenarios_upload/
 *   - Variáveis de ambiente Firebase configuradas
 */

// Log IMEDIATO antes de qualquer importação
console.log('🚀 Script iniciando...');
console.log('📝 Carregando módulos...');

// Tentar carregar variáveis de ambiente do .env.local
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
    console.log('✅ Variáveis de .env.local carregadas');
  } else {
    console.log('⚠️  Arquivo .env.local não encontrado');
  }
} catch (e) {
  console.log('⚠️  Erro ao carregar .env.local (continuando...)');
}

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('✅ Módulos fs e path importados');

// Importar Firebase Admin diretamente (sem usar getFirestoreAdmin que pode travar)
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

console.log('✅ Módulos Firebase importados');

let db: ReturnType<typeof getFirestore>;
let bucket: ReturnType<typeof getStorage>['bucket'];

// Inicializar Firebase Admin
function initializeFirebase() {
  console.log('🔧 Inicializando Firebase Admin...');
  
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.error('❌ Erro: Variáveis de ambiente Firebase não configuradas.');
      console.error('   Configure: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      process.exit(1);
    }

    console.log(`   ✓ Project ID: ${projectId}`);
    console.log(`   ✓ Client Email: ${clientEmail.substring(0, 20)}...`);
    console.log(`   ✓ Storage Bucket: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'não configurado'}\n`);

    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('   ✅ Firebase Admin inicializado com sucesso!\n');
    } catch (error: any) {
      console.error('   ❌ Erro ao inicializar Firebase Admin:', error.message);
      process.exit(1);
    }
  }

  // Usar getFirestore diretamente em vez de getFirestoreAdmin
  db = getFirestore();
  if (!db) {
    console.error('❌ Erro: Não foi possível obter Firestore Admin');
    process.exit(1);
  }

  const storage = getStorage();
  bucket = storage.bucket();
  if (!bucket) {
    console.error('❌ Erro: Não foi possível obter Storage Bucket');
    process.exit(1);
  }

  console.log('✅ Firebase configurado corretamente!\n');
}

interface ScenarioRow {
  filename: string;
  category: string;
  description: string;
  tags: string[];
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): ScenarioRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const scenarios: ScenarioRow[] = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // CSV parsing: handle quoted fields with commas
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim()); // Last field
    
    if (parts.length < 4) {
      console.warn(`⚠️  Linha ignorada (formato inválido): ${line.substring(0, 50)}...`);
      continue;
    }
    
    const filename = parts[0].replace(/^"|"$/g, '').trim();
    const category = parts[1].replace(/^"|"$/g, '').trim();
    const description = parts[2].replace(/^"|"$/g, '').trim();
    const tagsString = parts[3].replace(/^"|"$/g, '').trim();
    
    // Parse tags: split by comma and clean
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
    
    scenarios.push({
      filename,
      category: category.toLowerCase(),
      description,
      tags,
    });
  }
  
  return scenarios;
}

/**
 * Upload image to Firebase Storage
 */
async function uploadImage(
  localPath: string,
  storagePath: string
): Promise<string> {
  const file = bucket.file(storagePath);
  
  // Check if file already exists
  const [exists] = await file.exists();
  if (exists) {
    console.log(`   ✓ Imagem já existe no Storage: ${storagePath}`);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far future
    });
    return url;
  }
  
  // Upload file
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  // Get public URL
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2491',
  });
  
  return url;
}

/**
 * Main import function
 */
async function importScenarios() {
  // Inicializar Firebase primeiro
  initializeFirebase();
  
  console.log('🚀 Iniciando importação de cenários...\n');
  console.log(`📁 Diretório de trabalho: ${process.cwd()}\n`);
  
  const csvPath = join(process.cwd(), 'public', 'images', 'scenarios_upload', 'scenarios_data.csv');
  const imagesDir = join(process.cwd(), 'public', 'images', 'scenarios_upload');
  
  console.log(`📄 CSV: ${csvPath}`);
  console.log(`🖼️  Imagens: ${imagesDir}\n`);
  
  // Validate paths
  if (!existsSync(csvPath)) {
    console.error(`❌ Erro: Arquivo CSV não encontrado: ${csvPath}`);
    process.exit(1);
  }
  
  if (!existsSync(imagesDir)) {
    console.error(`❌ Erro: Diretório de imagens não encontrado: ${imagesDir}`);
    process.exit(1);
  }
  
  // Parse CSV
  console.log('📄 Lendo CSV...');
  const scenarios = parseCSV(csvPath);
  console.log(`   ✓ ${scenarios.length} cenários encontrados no CSV\n`);
  
  // Get existing scenarios to avoid duplicates
  const existingScenarios = await db.collection('scenarios').get();
  const existingFilenames = new Set(
    existingScenarios.docs.map(doc => doc.data().fileName)
  );
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log(`\n📦 Processando ${scenarios.length} cenários...\n`);
  
  // Process each scenario
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const progress = `[${i + 1}/${scenarios.length}]`;
    try {
      // Check if already imported
      if (existingFilenames.has(scenario.filename)) {
        console.log(`${progress} ⏭️  Pulando ${scenario.filename} (já importado)`);
        skipped++;
        continue;
      }
      
      // Find image file
      const imagePath = join(imagesDir, scenario.filename);
      if (!existsSync(imagePath)) {
        console.warn(`${progress} ⚠️  Imagem não encontrada: ${scenario.filename}`);
        errors++;
        continue;
      }
      
      console.log(`${progress} 📤 Processando: ${scenario.filename}`);
      console.log(`   Categoria: ${scenario.category}`);
      console.log(`   Tags: ${scenario.tags.join(', ')}`);
      console.log(`   Fazendo upload...`);
      
      // Upload to Storage
      const storagePath = `assets/scenarios/${scenario.category}/${scenario.filename}`;
      const imageUrl = await uploadImage(imagePath, storagePath);
      console.log(`   ✓ Upload concluído`);
      
      // Create Firestore document
      const docData = {
        imageUrl,
        fileName: scenario.filename,
        category: scenario.category,
        lightingPrompt: scenario.description,
        tags: scenario.tags,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('scenarios').add(docData);
      console.log(`   ✓ Documento criado no Firestore`);
      console.log(`   ✅ ${scenario.filename} importado com sucesso!\n`);
      
      imported++;
    } catch (error: any) {
      console.error(`${progress} ❌ Erro ao processar ${scenario.filename}:`, error.message);
      if (error.stack) {
        console.error(`   Stack:`, error.stack.substring(0, 200));
      }
      errors++;
      console.log(''); // Linha em branco para separar
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(50));
  console.log(`✅ Importados: ${imported}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📦 Total processado: ${scenarios.length}`);
  console.log('='.repeat(50) + '\n');
  
  if (errors > 0) {
    console.warn('⚠️  Alguns cenários não foram importados. Verifique os erros acima.');
    process.exit(1);
  }
  
  console.log('🎉 Importação concluída com sucesso!');
}

// Run import
console.log('='.repeat(50));
console.log('🔧 SCRIPT DE IMPORTAÇÃO DE CENÁRIOS');
console.log('='.repeat(50));
console.log('');

// Verificar variáveis de ambiente antes de começar
console.log('🔍 Verificando variáveis de ambiente...');
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
const hasStorageBucket = !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

console.log(`   FIREBASE_PROJECT_ID: ${hasProjectId ? '✅' : '❌'}`);
console.log(`   FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅' : '❌'}`);
console.log(`   FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅' : '❌'}`);
console.log(`   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${hasStorageBucket ? '✅' : '❌'}`);
console.log('');

if (!hasProjectId || !hasClientEmail || !hasPrivateKey) {
  console.error('❌ ERRO: Variáveis de ambiente Firebase não configuradas!');
  console.error('   Configure as variáveis no arquivo .env.local ou .env');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente OK!\n');
console.log('🚀 Iniciando importação...\n');

importScenarios()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  });

