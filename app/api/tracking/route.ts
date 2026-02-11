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
        events: data.events || [], // ✅ INCLUIR EVENTOS (con pagos, frenos, velocidad, etc.)
        totalDistance: data.totalDistance || 0,
        maxSpeed: data.maxSpeed || 0,
        averageSpeed: data.averageSpeed || 0,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, points, events } = body;

    console.log('🔄 Sincronizando puntos pendientes - sessionId:', sessionId, 'userId:', userId, 'nuevos puntos:', points?.length);

    if (!userId || !sessionId || !points || !Array.isArray(points)) {
      return NextResponse.json(
        { error: 'sessionId, userId y points son requeridos' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const trackingRef = db.collection('tracking');

    // Buscar si ya existe una sesión con este sessionId
    const q = trackingRef.where('sessionId', '==', sessionId);
    const existingDocs = await q.get();

    if (existingDocs.empty) {
      // Crear nuevo documento si no existe
      console.log('📝 Creando nuevo documento de tracking...');
      const newDoc = await trackingRef.add({
        userId,
        sessionId,
        startTime: Timestamp.fromDate(new Date(points[0]?.timestamp || new Date())),
        endTime: Timestamp.fromDate(new Date(points[points.length - 1]?.timestamp || new Date())),
        points,
        events: events || [],
        totalDistance: 0,
        maxSpeed: 0,
        averageSpeed: 0,
        syncedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
      console.log('✅ Nuevo documento creado:', newDoc.id);
      
      return NextResponse.json({
        success: true,
        message: 'Tracking creado exitosamente',
        docId: newDoc.id,
        pointsCount: points.length,
      });
    }

    // Actualizar documento existente
    const docRef = existingDocs.docs[0].ref;
    const existingData = existingDocs.docs[0].data();
    const existingPoints = existingData.points || [];
    const existingEvents = existingData.events || [];

    console.log('📝 Actualizando documento existente...');
    console.log('  Puntos existentes:', existingPoints.length, '+ Nuevos:', points.length);

    // Combinar puntos evitando duplicados (comparar por timestamp)
    const allPoints = [...existingPoints];
    const addedPoints: typeof points = [];
    
    points.forEach((newPoint: any) => {
      const isDuplicate = existingPoints.some((existing: any) => 
        Math.abs(new Date(existing.timestamp).getTime() - new Date(newPoint.timestamp).getTime()) < 500 // menos de 500ms
      );
      if (!isDuplicate) {
        allPoints.push(newPoint);
        addedPoints.push(newPoint);
      }
    });

    // Combinar eventos
    const allEvents = [...existingEvents];
    if (events && Array.isArray(events)) {
      events.forEach((newEvent: any) => {
        const isDuplicate = existingEvents.some((existing: any) => 
          Math.abs(new Date(existing.timestamp).getTime() - new Date(newEvent.timestamp).getTime()) < 500
        );
        if (!isDuplicate) {
          allEvents.push(newEvent);
        }
      });
    }

    // Recalcular estadísticas
    let totalDistance = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    for (let i = 1; i < allPoints.length; i++) {
      const lat1 = allPoints[i - 1].latitude;
      const lon1 = allPoints[i - 1].longitude;
      const lat2 = allPoints[i].latitude;
      const lon2 = allPoints[i].longitude;

      // Haversine formula
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;

      const speed = allPoints[i].speed || 0;
      if (speed > 0) {
        maxSpeed = Math.max(maxSpeed, speed * 3.6); // m/s a km/h
        totalSpeed += speed * 3.6;
        speedCount++;
      }
    }

    const averageSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;

    await docRef.update({
      endTime: Timestamp.fromDate(new Date(allPoints[allPoints.length - 1]?.timestamp || new Date())),
      points: allPoints,
      events: allEvents,
      totalDistance,
      maxSpeed,
      averageSpeed,
      syncedAt: Timestamp.now(),
    });

    console.log(`✅ Documento actualizado - Total puntos: ${allPoints.length}, Añadidos: ${addedPoints.length}`);

    return NextResponse.json({
      success: true,
      message: 'Puntos sincronizados exitosamente',
      docId: docRef.id,
      totalPoints: allPoints.length,
      addedPoints: addedPoints.length,
    });
  } catch (error) {
    console.error('Error sincronizando puntos:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar puntos' },
      { status: 500 }
    );
  }
}
