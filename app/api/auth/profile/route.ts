import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Usuario } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/profile?email=cajaesmeraldas@cobranza.com
 *
 * Busca el documento de usuario en Firestore que coincida con el email de Firebase Auth.
 * Estrategia de búsqueda (en orden):
 *   1. Campo `email` del documento == loginEmail
 *   2. Campo `usuario` == parte antes del @ (ej: "cajaesmeraldas")
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const db = adminDb();
    let usuario: Usuario | null = null;

    // 1. Buscar por campo email exacto
    const byEmail = await db
      .collection('usuarios')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!byEmail.empty) {
      const doc = byEmail.docs[0];
      usuario = { id: doc.id, ...doc.data() } as Usuario;
    }

    // 2. Fallback: buscar por campo `usuario` == parte antes del @
    if (!usuario) {
      const nombreUsuario = email.split('@')[0];
      const byUsuario = await db
        .collection('usuarios')
        .where('usuario', '==', nombreUsuario)
        .limit(1)
        .get();

      if (!byUsuario.empty) {
        const doc = byUsuario.docs[0];
        usuario = { id: doc.id, ...doc.data() } as Usuario;
      }
    }

    if (!usuario) {
      return NextResponse.json({ usuario: null });
    }

    // Devolver datos relevantes (sin clave/contraseña)
    const { clave, ...safeUsuario } = usuario as any;
    return NextResponse.json({ usuario: safeUsuario });
  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
