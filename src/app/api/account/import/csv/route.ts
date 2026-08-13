import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { parse } from 'csv-parse/sync';
import { logger } from '@/lib/logging/logger';
import { financialService } from '@/modules/finances/application/financial-service';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    const text = await file.text();

    let importedCount = 0;

    switch (type) {
      case 'finances': {
        const importResult = await financialService.importFinancesCSV(userId, text);
        if (!importResult.success && importResult.importedCount === 0) {
          return NextResponse.json(
            { error: importResult.errors.join('; ') || 'Fichier CSV vide ou mal formaté' },
            { status: 400 }
          );
        }
        importedCount = importResult.importedCount;
        break;
      }

      case 'contacts':
        // Contacts import handled by CRM module
        break;

      case 'decisions':
        // Decisions import handled by decision module
        break;

      default:
        return NextResponse.json({ error: 'Type d\'import non supporté' }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (e: any) {
    logger.error('[CSV Import Error]', e, { userId });
    return NextResponse.json({ error: e.message || 'Erreur lors de l\'importation' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
