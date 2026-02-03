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
    
    // Crear fechas en UTC ajustadas para UTC-5 (Colombia/Perú)
    // 00:00 hora local = 05:00 UTC
    // 23:59 hora local = 04:59 UTC del día siguiente
    const targetDate = new Date(`${dateStr}T05:00:00.000Z`); // Inicio del día en hora local
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);   // Fin del día completo
    endDate.setDate(endDate.getDate() + 1); // Ajustar al día siguiente para UTC-5
    endDate.setHours(4, 59, 59, 999); // 23:59:59 hora local = 04:59:59 UTC del día siguiente

    console.log('📅 Rango de búsqueda:', targetDate.toISOString(), 'hasta', endDate.toISOString());

    // Consultar Firestore con Admin SDK
    const db = adminDb();
    const trackingRef = db.collection('tracking');
    
    // Primero ver TODOS los documentos del usuario para debug
    const allDocs = await trackingRef.where('userId', '==', userId).get();
    console.log('🔍 Total documentos del usuario (sin filtro fecha):', allDocs.size);
    allDocs.forEach(doc => {
      const data = doc.data();
      console.log('  - Doc:', doc.id, 'startTime:', data.startTime?.toDate().toISOString());
    });
    
    const snapshot = await trackingRef
      .where('userId', '==', userId)
      .where('startTime', '>=', Timestamp.fromDate(targetDate))
      .where('startTime', '<=', Timestamp.fromDate(endDate))
      .orderBy('startTime', 'desc')
      .get();

    console.log('📊 Documentos encontrados:', snapshot.size);

    const sessions: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Doc:', doc.id, 'startTime:', data.startTime?.toDate());
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
