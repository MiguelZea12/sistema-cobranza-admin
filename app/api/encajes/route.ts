import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { EncajeCaja } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuario = searchParams.get('usuario');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    // Verificar que Firebase Admin esté configurado
    const db = adminDb();
    if (!db) {
      console.error('Firebase Admin no está configurado correctamente');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    let query = db.collection('encajes_caja').orderBy('fecha', 'desc');

    // Filtrar por usuario si se proporciona
    if (usuario) {
      query = query.where('usuarioNombre', '==', usuario) as any;
    }

    const snapshot = await query.get();
    let encajes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate?.() || data.fecha,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as EncajeCaja;
    });

    // Filtrar por rango de fechas en memoria
    if (fechaInicio || fechaFin) {
      encajes = encajes.filter(encaje => {
        const fechaEncaje = new Date(encaje.fecha);
        if (fechaInicio && fechaEncaje < new Date(fechaInicio)) return false;
        if (fechaFin && fechaEncaje > new Date(fechaFin)) return false;
        return true;
      });
    }

    return NextResponse.json(encajes);
  } catch (error: any) {
    console.error('Error obteniendo encajes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
