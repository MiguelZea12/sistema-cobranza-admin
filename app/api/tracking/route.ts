import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    console.log('📍 API Tracking - userId:', userId, 'date:', date);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Si no se especifica fecha, usar hoy
    const dateStr = date || new Date().toISOString().split('T')[0];
    
    const db = adminDb();
    const trackingRef = db.collection('tracking');
    
    // PRIMERO: Ver TODOS los documentos de tracking para diagnosticar
    console.log('🔍 === DIAGNÓSTICO DE TRACKING ===');
    const allTracking = await trackingRef.limit(20).orderBy('startTime', 'desc').get();
    console.log('📋 Total documentos en tracking:', allTracking.size);
    allTracking.forEach(doc => {
      const data = doc.data();
      console.log('  - Doc:', doc.id);
      console.log('    userId:', data.userId);
      console.log('    sessionId:', data.sessionId);
      console.log('    startTime:', data.startTime?.toDate().toISOString());
      console.log('    points:', data.points?.length || 0);
    });

    // SEGUNDO: Buscar por el userId exacto
    let snapshot = await trackingRef.where('userId', '==', userId).orderBy('startTime', 'desc').get();
    console.log('📊 Documentos con userId exacto:', snapshot.size);

    // Si no encuentra nada, intentar buscar sin filtro de userId (todos los documentos)
    if (snapshot.empty) {
      console.log('⚠️ No se encontró con userId, buscando TODOS los documentos...');
      snapshot = await trackingRef.orderBy('startTime', 'desc').limit(50).get();
      console.log('📊 Total documentos (sin filtro):', snapshot.size);
    }

    const sessions: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        sessionId: data.sessionId,
        userId: data.userId,
        startTime: data.startTime?.toDate().toISOString(),
        endTime: data.endTime?.toDate().toISOString(),
        points: data.points || [],
        totalDistance: data.totalDistance || 0,
        createdAt: data.createdAt?.toDate().toISOString(),
      });
    });

    console.log('✅ Retornando', sessions.length, 'sesiones');

    return NextResponse.json({
      success: true,
      data: sessions,
      count: sessions.length,
      debug: {
        searchedUserId: userId,
        date: dateStr,
        foundWithUserId: snapshot.size > 0,
      }
    });
  } catch (error) {
    console.error('Error obteniendo tracking:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de tracking' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, points, totalDistance } = body;

    if (!userId || !points || !Array.isArray(points)) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Aquí puedes guardar en la base de datos si es necesario
    // Por ahora, Firestore se actualiza desde la app móvil

    return NextResponse.json({
      success: true,
      message: 'Tracking recibido',
    });
  } catch (error) {
    console.error('Error guardando tracking:', error);
    return NextResponse.json(
      { error: 'Error al guardar tracking' },
      { status: 500 }
    );
  }
}
