import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { Cobro } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      clienteCedula,
      clienteNombre,
      monto,
      saldoAnterior,
      saldoNuevo,
      formaPago,
      observaciones,
      imageUrl,
      contratoId,
      contratoReferencia,
      letrasPagadas,
      totalLetras,
      numeroComprobante,
      datosCheque,
      tipoTarjeta,
      sucursal,
      caja,
      cobrador,
      createdBy,
      contratosActualizados,
      nuevoSaldoPendiente,
      nuevoSaldoVencido,
      nuevoSaldoPorVencer,
    } = body;

    if (!clienteId || !monto || !formaPago) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const db = adminDb();

    // Construir objeto cobro
    const cobroData: any = {
      clienteId,
      clienteCedula,
      clienteNombre,
      monto,
      saldoAnterior,
      saldoNuevo,
      formaPago,
      fecha: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      syncStatus: 'pending',
      offlineSync: false,
    };

    if (contratoId) cobroData.contratoId = contratoId;
    if (contratoReferencia) cobroData.contratoReferencia = contratoReferencia;
    if (observaciones) cobroData.observaciones = observaciones;
    if (imageUrl) cobroData.imageUrl = imageUrl;
    if (letrasPagadas && letrasPagadas.length > 0) cobroData.letrasPagadas = letrasPagadas;
    if (totalLetras !== undefined) cobroData.totalLetras = totalLetras;
    if (numeroComprobante) cobroData.numeroComprobante = numeroComprobante;
    if (datosCheque) cobroData.datosCheque = datosCheque;
    if (tipoTarjeta) cobroData.tipoTarjeta = tipoTarjeta;
    if (sucursal) cobroData.sucursal = sucursal;
    if (caja) cobroData.caja = caja;
    if (cobrador) cobroData.cobrador = cobrador;
    if (createdBy) cobroData.createdBy = createdBy;

    // Guardar cobro en Firestore
    const cobroRef = await db.collection('cobros').add(cobroData);

    // Actualizar saldos del cliente
    const clienteUpdateData: any = {
      saldoPendiente: nuevoSaldoPendiente,
      saldoVencido: nuevoSaldoVencido,
      saldoPorVencer: nuevoSaldoPorVencer,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (contratosActualizados) {
      clienteUpdateData.contratos = contratosActualizados;
    }

    await db.collection('clientes').doc(clienteId).update(clienteUpdateData);

    return NextResponse.json({ id: cobroRef.id, success: true });
  } catch (error: any) {
    console.error('Error registrando cobro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
