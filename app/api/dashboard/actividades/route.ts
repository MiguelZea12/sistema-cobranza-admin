import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '20');

    const actividades: any[] = [];

    // Obtener cobros recientes
    const cobrosRef = collection(db, 'cobros');
    const cobrosQuery = query(
      cobrosRef,
      orderBy('fecha', 'desc'),
      limit(limitCount)
    );
    const cobrosSnapshot = await getDocs(cobrosQuery);

    cobrosSnapshot.forEach((doc) => {
      const data = doc.data();
      actividades.push({
        id: doc.id,
        tipo: 'cobro',
        usuario: data.createdBy || 'Desconocido',
        monto: data.monto || 0,
        clienteNombre: data.clienteNombre || 'Cliente desconocido',
        fecha: data.fecha?.toDate() || new Date(),
        formaPago: data.formaPago || 'efectivo',
      });
    });

    // Obtener encajes recientes
    const encajesRef = collection(db, 'encajes_caja');
    const encajesQuery = query(
      encajesRef,
      orderBy('fecha', 'desc'),
      limit(limitCount)
    );
    const encajesSnapshot = await getDocs(encajesQuery);

    encajesSnapshot.forEach((doc) => {
      const data = doc.data();
      actividades.push({
        id: doc.id,
        tipo: 'encaje',
        usuario: data.usuarioNombre || 'Desconocido',
        monto: data.totalDeclarado || 0,
        fecha: data.fecha?.toDate() || new Date(),
        diferencia: data.diferencia || 0,
      });
    });

    // Ordenar todas las actividades por fecha
    actividades.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    // Limitar al número solicitado
    const actividadesLimitadas = actividades.slice(0, limitCount);

    return NextResponse.json(actividadesLimitadas);
  } catch (error: any) {
    console.error('Error obteniendo actividades:', error);
    return NextResponse.json(
      { error: 'Error al obtener actividades', details: error.message },
      { status: 500 }
    );
  }
}
