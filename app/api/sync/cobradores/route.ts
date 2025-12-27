import { NextRequest, NextResponse } from 'next/server';
import { CobradorSyncService } from '@/services/sync/CobradorSyncService';

const service = new CobradorSyncService();

export async function POST(request: NextRequest) {
  try {
    const { periodo, direction } = await request.json();
    
    if (!periodo) {
      return NextResponse.json({ error: 'Periodo requerido' }, { status: 400 });
    }

    let result;
    if (direction === 'toFirebase') {
      result = await service.syncFromSQLToFirebase(periodo);
    } else if (direction === 'toSQL') {
      result = await service.syncFromFirebaseToSQL(periodo);
    } else {
      // Sincronización bidireccional
      const toFirebase = await service.syncFromSQLToFirebase(periodo);
      const toSQL = await service.syncFromFirebaseToSQL(periodo);
      result = {
        success: toFirebase.success && toSQL.success,
        toFirebase,
        toSQL,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
