import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Ecuador es UTC-5, sin horario de verano
const ECUADOR_OFFSET_HOURS = -5;

function getEcuadorTodayRange() {
  const nowUTC = new Date();
  // Convertir a hora Ecuador
  const ecuadorNow = new Date(nowUTC.getTime() + ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);
  // Inicio del día en Ecuador (00:00:00)
  const startEcuador = new Date(ecuadorNow);
  startEcuador.setUTCHours(0, 0, 0, 0);
  // Convertir de nuevo a UTC para Firestore
  const startUTC = new Date(startEcuador.getTime() - ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);

  // Fin del día en Ecuador (23:59:59.999)
  const endEcuador = new Date(ecuadorNow);
  endEcuador.setUTCHours(23, 59, 59, 999);
  const endUTC = new Date(endEcuador.getTime() - ECUADOR_OFFSET_HOURS * 60 * 60 * 1000);

  return { startUTC, endUTC, ecuadorDate: ecuadorNow };
}

export async function GET(request: Request) {
  try {
    // Siempre filtrar por el día de hoy en horario Ecuador
    const { startUTC, endUTC } = getEcuadorTodayRange();

    // Obtener cobros
    const cobrosRef = collection(db, 'cobros');
    const cobrosQuery = query(
      cobrosRef,
      where('fecha', '>=', Timestamp.fromDate(startUTC)),
      where('fecha', '<=', Timestamp.fromDate(endUTC)),
      orderBy('fecha', 'desc'),
      limit(1000)
    );
    const cobrosSnapshot = await getDocs(cobrosQuery);

    let totalCobrado = 0;
    let totalEfectivo = 0;
    let totalTransferencias = 0;
    const cobradoresMapa = new Map<string, { total: number; cantidad: number }>();

    cobrosSnapshot.forEach((doc) => {
      const data = doc.data();
      const monto = data.monto || 0;
      const usuario = data.createdBy || 'Sin usuario';

      totalCobrado += monto;

      if (data.formaPago === 'efectivo') {
        totalEfectivo += monto;
      } else if (data.formaPago === 'transferencia') {
        totalTransferencias += monto;
      }

      // Acumular por cobrador
      const cobradorData = cobradoresMapa.get(usuario) || { total: 0, cantidad: 0 };
      cobradorData.total += monto;
      cobradorData.cantidad += 1;
      cobradoresMapa.set(usuario, cobradorData);
    });

    // Top cobradores
    const topCobradores = Array.from(cobradoresMapa.entries())
      .map(([usuario, data]) => ({
        usuario,
        total: data.total,
        cantidad: data.cantidad,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Obtener encajes
    const encajesRef = collection(db, 'encajes_caja');
    const encajesQuery = query(
      encajesRef,
      where('fecha', '>=', Timestamp.fromDate(startUTC)),
      where('fecha', '<=', Timestamp.fromDate(endUTC)),
      orderBy('fecha', 'desc'),
      limit(1000)
    );
    const encajesSnapshot = await getDocs(encajesQuery);

    const totalEncajes = encajesSnapshot.size;
    let totalDiferencias = 0;
    let encajesConProblemas = 0;

    encajesSnapshot.forEach((doc) => {
      const data = doc.data();
      const diferencia = data.diferencia || 0;
      totalDiferencias += Math.abs(diferencia);
      if (diferencia !== 0) {
        encajesConProblemas++;
      }
    });

    const stats = {
      totalCobrado,
      totalEfectivo,
      totalTransferencias,
      cantidadCobros: cobrosSnapshot.size,
      topCobradores,
      totalEncajes,
      encajesConProblemas,
      totalDiferencias,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', details: error.message },
      { status: 500 }
    );
  }
}
