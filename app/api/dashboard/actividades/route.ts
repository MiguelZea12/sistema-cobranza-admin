import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Ecuador es UTC-5, sin horario de verano
const ECUADOR_OFFSET_HOURS = -5;

function getEcuadorTodayRange() {
  const nowUTC = new Date();
  const ecuadorNow = new Date(nowUTC.getTime() + ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);
  const startEcuador = new Date(ecuadorNow);
  startEcuador.setUTCHours(0, 0, 0, 0);
  const startUTC = new Date(startEcuador.getTime() - ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);
  const endEcuador = new Date(ecuadorNow);
  endEcuador.setUTCHours(23, 59, 59, 999);
  const endUTC = new Date(endEcuador.getTime() - ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);
  return { startUTC, endUTC };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '20');

    const { startUTC, endUTC } = getEcuadorTodayRange();
    const actividades: any[] = [];

    // Obtener cobros del día de hoy en horario Ecuador
    const cobrosRef = collection(db, 'cobros');
    const cobrosQuery = query(
      cobrosRef,
      where('fecha', '>=', Timestamp.fromDate(startUTC)),
      where('fecha', '<=', Timestamp.fromDate(endUTC)),
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

    // Obtener encajes del día de hoy en horario Ecuador
    const encajesRef = collection(db, 'encajes_caja');
    const encajesQuery = query(
      encajesRef,
      where('fecha', '>=', Timestamp.fromDate(startUTC)),
      where('fecha', '<=', Timestamp.fromDate(endUTC)),
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
