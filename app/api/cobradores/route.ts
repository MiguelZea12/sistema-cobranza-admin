import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Cobrador } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await adminDb().collection('cobradores').orderBy('cobrador').get();
    const cobradores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Cobrador));
    return NextResponse.json(cobradores);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
