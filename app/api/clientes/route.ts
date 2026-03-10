import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Cliente } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const db = adminDb();
    const snapshot = await db.collection('clientes').orderBy('nombre').get();

    const clientes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Cliente;
    });

    return NextResponse.json({ clientes });
  } catch (error: any) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
