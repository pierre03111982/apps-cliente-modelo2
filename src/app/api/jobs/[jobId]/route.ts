/**
 * PHASE 27: Endpoint de Polling para Status do Job
 * 
 * GET /api/jobs/[jobId]
 * Retorna o status atual do Job de geração
 */

import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId é obrigatório" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const jobDoc = await db.collection("generation_jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: "Job não encontrado" },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data();

    // Converter Timestamps do Firestore para ISO strings
    const formatTimestamp = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate().toISOString();
      if (ts instanceof Date) return ts.toISOString();
      return ts;
    };

    return NextResponse.json({
      jobId,
      status: jobData?.status,
      reservationId: jobData?.reservationId,
      createdAt: formatTimestamp(jobData?.createdAt),
      startedAt: formatTimestamp(jobData?.startedAt),
      completedAt: formatTimestamp(jobData?.completedAt),
      failedAt: formatTimestamp(jobData?.failedAt),
      error: jobData?.error,
      errorDetails: jobData?.errorDetails,
      result: jobData?.result,
      viewedAt: formatTimestamp(jobData?.viewedAt),
      creditCommitted: jobData?.creditCommitted || false,
    });
  } catch (error: any) {
    console.error("[jobs] Erro ao buscar Job:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao buscar Job",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

