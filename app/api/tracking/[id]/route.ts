import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Inicializar Firebase en el servidor
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackingRef = doc(db, 'tracking', params.id);
    const docSnap = await getDoc(trackingRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    const trackingData = {
      id: docSnap.id,
      sessionId: data.sessionId,
      userId: data.userId,
      startTime: data.startTime?.toDate().toISOString(),
      endTime: data.endTime?.toDate().toISOString(),
      points: data.points || [],
      totalDistance: data.totalDistance || 0,
      createdAt: data.createdAt?.toDate().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error('Error obteniendo ruta:', error);
    return NextResponse.json(
      { error: 'Error al obtener la ruta' },
      { status: 500 }
    );
  }
}
