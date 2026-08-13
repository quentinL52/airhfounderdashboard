import { NextRequest, NextResponse } from 'next/server';
import { extractAndSaveGraphData } from '@/lib/ai/memory/knowledge-graph';
import { prisma } from '@/lib/prisma';
import { VectorStore } from '@/lib/ai/memory/vector-store';
import { logger } from '@/lib/logging/logger';

const vectorStore = new VectorStore();

export async function POST(req: NextRequest) {
  let reqNoteId: string | undefined;
  let reqUserId: string | undefined;
  try {
    const body = await req.json();
    const { noteId, userId, content, type } = body;
    reqNoteId = noteId;
    reqUserId = userId;

    if (!noteId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Appel LLM pour extraction
    const graphData = await extractAndSaveGraphData(userId, content);
    
    // 2. MAJ DB avec entités
    await prisma.memoryNote.update({
      where: { id: noteId },
      data: { 
        entities: graphData.nodes as any
      }
    });
    
    // 3. Mettre à jour l'embedding
    await vectorStore.updateNoteEmbedding(noteId, content);
    
    return NextResponse.json({ success: true, entitiesCount: graphData.nodes.length });
  } catch (error: any) {
    logger.error('Failed to process memory extract job', error, { noteId: reqNoteId, userId: reqUserId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
