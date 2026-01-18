import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || '30'; // días

    // Calcular fecha límite
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - parseInt(periodo));

    // Obtener cobros
    const cobrosRef = collection(db, 'cobros');
    const cobrosQuery = query(
      cobrosRef,
      where('fecha', '>=', Timestamp.fromDate(fechaLimite)),
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
      where('fecha', '>=', Timestamp.fromDate(fechaLimite)),
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
