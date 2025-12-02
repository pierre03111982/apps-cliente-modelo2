import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, getApps, cert } from "firebase-admin/app";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ScenarioRow {
  filename: string;
  category: string;
  description: string;
  tags: string[];
}

function parseCSV(filePath: string): ScenarioRow[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const dataLines = lines.slice(1); // Skip header

  const scenarios: ScenarioRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Remove leading/trailing quotes if entire line is quoted
    let cleanLine = line.trim();
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
      cleanLine = cleanLine.slice(1, -1);
    }

    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < cleanLine.length; i++) {
      const char = cleanLine[i];

      if (char === '"') {
        // Handle escaped quotes ("")
        if (inQuotes && cleanLine[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    // Add last part
    parts.push(current.trim());

    if (parts.length < 4) {
      console.warn(`Linha ignorada (menos de 4 colunas): ${line.substring(0, 50)}...`);
      continue;
    }

    const filename = parts[0].replace(/^"|"$/g, "").trim();
    const category = parts[1].replace(/^"|"$/g, "").trim();
    const description = parts[2].replace(/^"|"$/g, "").trim();
    const tagsString = parts[3].replace(/^"|"$/g, "").trim();

    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    scenarios.push({
      filename,
      category: category.toLowerCase(),
      description,
      tags,
    });
  }

  return scenarios;
}

async function uploadImage(
  localPath: string,
  storagePath: string,
  bucket: any
): Promise<string> {
  const file = bucket.file(storagePath);

  const [exists] = await file.exists();
  if (exists) {
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2491",
    });
    return url;
  }

  // Detectar tipo de imagem pela extensão
  const ext = localPath.toLowerCase().split('.').pop();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: contentType,
      cacheControl: "public, max-age=31536000",
    },
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });

  return url;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 Iniciando importação de cenários via API...\n");

    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (!projectId || !clientEmail || !privateKey) {
        return NextResponse.json(
          { error: "Variáveis de ambiente Firebase não configuradas" },
          { status: 500 }
        );
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    const db = getFirestore();
    const storage = getStorage();
    const bucket = storage.bucket();

    const csvPath = join(
      process.cwd(),
      "public",
      "images",
      "scenarios_upload",
      "scenarios_data.csv"
    );
    const imagesDir = join(
      process.cwd(),
      "public",
      "images",
      "scenarios_upload"
    );

    if (!existsSync(csvPath)) {
      return NextResponse.json(
        { error: `Arquivo CSV não encontrado: ${csvPath}` },
        { status: 404 }
      );
    }

    if (!existsSync(imagesDir)) {
      return NextResponse.json(
        { error: `Diretório de imagens não encontrado: ${imagesDir}` },
        { status: 404 }
      );
    }

    const scenarios = parseCSV(csvPath);
    console.log(`📄 ${scenarios.length} cenários encontrados no CSV\n`);

    const existingScenarios = await db.collection("scenarios").get();
    const existingFilenames = new Set(
      existingScenarios.docs.map((doc) => doc.data().fileName)
    );
    // Também verificar nomes sem extensão para evitar duplicatas
    const existingBaseNames = new Set(
      existingScenarios.docs.map((doc) => {
        const fileName = doc.data().fileName || '';
        return fileName.replace(/\.(jpg|jpeg|png)$/i, '');
      })
    );

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorsList: string[] = [];

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const progress = `[${i + 1}/${scenarios.length}]`;

      try {
        const baseName = scenario.filename.replace(/\.(jpg|jpeg|png)$/i, '');
        if (existingFilenames.has(scenario.filename) || existingBaseNames.has(baseName)) {
          console.log(
            `${progress} ⏭️  Pulando ${scenario.filename} (já importado)`
          );
          skipped++;
          continue;
        }

        // Tentar encontrar a imagem (pode ser .jpg ou .png)
        let imagePath = join(imagesDir, scenario.filename);
        if (!existsSync(imagePath)) {
          // Tentar com extensão alternativa
          const baseName = scenario.filename.replace(/\.(jpg|jpeg|png)$/i, '');
          const jpgPath = join(imagesDir, `${baseName}.jpg`);
          const pngPath = join(imagesDir, `${baseName}.png`);
          
          if (existsSync(pngPath)) {
            imagePath = pngPath;
            console.log(`   ℹ️  Usando ${baseName}.png em vez de ${scenario.filename}`);
          } else if (existsSync(jpgPath)) {
            imagePath = jpgPath;
          } else {
            errorsList.push(`${scenario.filename}: Imagem não encontrada (.jpg ou .png)`);
            errors++;
            continue;
          }
        }

        console.log(`${progress} 📤 Processando: ${scenario.filename}`);

        // Usar o nome do arquivo real (pode ser .png se o CSV dizia .jpg)
        const actualFilename = imagePath.split(/[/\\]/).pop() || scenario.filename;
        const storagePath = `assets/scenarios/${scenario.category}/${actualFilename}`;
        const imageUrl = await uploadImage(imagePath, storagePath, bucket);

        const docData = {
          imageUrl,
          fileName: actualFilename, // Usar nome real do arquivo
          category: scenario.category,
          lightingPrompt: scenario.description,
          tags: scenario.tags,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("scenarios").add(docData);
        console.log(`${progress} ✅ ${scenario.filename} importado\n`);

        imported++;
      } catch (error: any) {
        errorsList.push(`${scenario.filename}: ${error.message}`);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        imported,
        skipped,
        errors,
        total: scenarios.length,
      },
      errors: errorsList.length > 0 ? errorsList : undefined,
    });
  } catch (error: any) {
    console.error("❌ Erro fatal:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao importar cenários" },
      { status: 500 }
    );
  }
}
