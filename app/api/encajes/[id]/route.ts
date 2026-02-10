import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar que Firebase Admin esté configurado
    const db = adminDb();
    if (!db) {
      console.error('Firebase Admin no está configurado correctamente');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    const encajeRef = db.collection('encajes_caja').doc(id);
    const encajeDoc = await encajeRef.get();

    if (!encajeDoc.exists) {
      return NextResponse.json({ error: 'Arqueo no encontrado' }, { status: 404 });
    }

    // Campos actualizables
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Actualizar solo los campos proporcionados
    if (body.totalDeclarado !== undefined) {
      updateData.totalDeclarado = body.totalDeclarado;
    }
    if (body.efectivo !== undefined) {
      updateData.efectivo = body.efectivo;
    }
    if (body.transferencia !== undefined) {
      updateData.transferencia = body.transferencia;
    }
    if (body.desglose !== undefined) {
      updateData.desglose = body.desglose;
    }
    if (body.observaciones !== undefined) {
      updateData.observaciones = body.observaciones;
    }

    // Recalcular diferencia si se actualizó totalDeclarado
    if (body.totalDeclarado !== undefined) {
      const currentData = encajeDoc.data();
      const totalCobrado = currentData?.totalCobrado || 0;
      updateData.diferencia = totalCobrado - body.totalDeclarado;
    }

    await encajeRef.update(updateData);

    // Obtener el documento actualizado
    const updatedDoc = await encajeRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedData,
      fecha: updatedData?.fecha?.toDate?.() || updatedData?.fecha,
      createdAt: updatedData?.createdAt?.toDate?.() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.() || updatedData?.updatedAt,
    });
  } catch (error: any) {
    console.error('Error actualizando arqueo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que Firebase Admin esté configurado
    const db = adminDb();
    if (!db) {
      console.error('Firebase Admin no está configurado correctamente');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    const encajeRef = db.collection('encajes_caja').doc(id);
    const encajeDoc = await encajeRef.get();

    if (!encajeDoc.exists) {
      return NextResponse.json({ error: 'Arqueo no encontrado' }, { status: 404 });
    }

    await encajeRef.delete();

    return NextResponse.json({ message: 'Arqueo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando arqueo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
