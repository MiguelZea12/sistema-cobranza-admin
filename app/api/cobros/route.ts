import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Cobro } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuario = searchParams.get('usuario');
    const cliente = searchParams.get('cliente');
    const formaPago = searchParams.get('formaPago');
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    let query = adminDb().collection('cobros').orderBy('fecha', 'desc');

    // Filtrar por usuario si se proporciona
    if (usuario) {
      query = query.where('createdBy', '==', usuario) as any;
    }

    const snapshot = await query.get();
    let cobros = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate?.() || data.fecha,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Cobro;
    });

    // Filtrar por cliente en memoria
    if (cliente) {
      cobros = cobros.filter(c => 
        c.clienteNombre.toLowerCase().includes(cliente.toLowerCase()) ||
        c.clienteCedula.includes(cliente)
      );
    }

    // Filtrar por forma de pago
    if (formaPago) {
      cobros = cobros.filter(c => c.formaPago === formaPago);
    }

    // Filtrar por rango de fechas en memoria
    if (fechaInicio || fechaFin) {
      cobros = cobros.filter(cobro => {
        const fechaCobro = new Date(cobro.fecha);
        if (fechaInicio && fechaCobro < new Date(fechaInicio)) return false;
        if (fechaFin && fechaCobro > new Date(fechaFin)) return false;
        return true;
      });
    }

    return NextResponse.json(cobros);
  } catch (error: any) {
    console.error('Error obteniendo cobros:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
