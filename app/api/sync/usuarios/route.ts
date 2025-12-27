import { NextRequest, NextResponse } from 'next/server';
import { UsuarioSyncService } from '@/services/sync/UsuarioSyncService';

const service = new UsuarioSyncService();

export async function POST(request: NextRequest) {
  try {
    const { periodo, direction } = await request.json();

    let result;
    if (direction === 'toFirebase') {
      const usuarios = await service.syncUsuariosFromSQLToFirebase();
      const permisos = periodo ? await service.syncPermisosFromSQLToFirebase(periodo) : { success: true, count: 0, errors: [] };
      result = {
        success: usuarios.success && permisos.success,
        usuarios,
        permisos,
      };
    } else if (direction === 'toSQL') {
      result = await service.syncUsuariosFromFirebaseToSQL();
    } else {
      // Sincronización bidireccional
      const toFirebase = await service.syncUsuariosFromSQLToFirebase();
      const permisos = periodo ? await service.syncPermisosFromSQLToFirebase(periodo) : { success: true, count: 0, errors: [] };
      const toSQL = await service.syncUsuariosFromFirebaseToSQL();
      result = {
        success: toFirebase.success && permisos.success && toSQL.success,
        toFirebase,
        permisos,
        toSQL,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
