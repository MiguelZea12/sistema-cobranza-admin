'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Download, MapPin, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface Card {
  children?: React.ReactNode;
  className?: string;
}

interface CardContent {
  children?: React.ReactNode;
  className?: string;
}

interface CardHeader {
  children?: React.ReactNode;
  className?: string;
}

interface CardTitle {
  children?: React.ReactNode;
  className?: string;
}

interface CardDescription {
  children?: React.ReactNode;
  className?: string;
}

interface Button {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: string;
  variant?: string;
}

interface Badge {
  children?: React.ReactNode;
  className?: string;
}

const SimpleCard: React.FC<Card> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const SimpleCardContent: React.FC<CardContent> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const SimpleCardHeader: React.FC<CardHeader> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const SimpleCardTitle: React.FC<CardTitle> = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
);

const SimpleCardDescription: React.FC<CardDescription> = ({ children }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

const SimpleButton: React.FC<Button> = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${className}`}
  >
    {children}
  </button>
);

const SimpleBadge: React.FC<Badge> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

interface TrackingPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface TrackingSession {
  id: string;
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  points: TrackingPoint[];
  totalDistance: number;
  createdAt: string;
}

interface TrackingMapProps {
  sessionId: string;
  onDataLoaded?: (session: TrackingSession) => void;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({ sessionId, onDataLoaded }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tracking/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('No se pudo obtener el tracking');
        }

        const data = await response.json();
        if (data.success) {
          setSession(data.data);
          onDataLoaded?.(data.data);
          renderMap(data.data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar tracking';
        setError(message);
        console.error('Error:', message);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [sessionId, onDataLoaded]);

  const renderMap = async (trackingData: TrackingSession) => {
    if (!mapContainerRef.current) {
      console.error('Contenedor de mapa no disponible');
      return;
    }

    try {
      // @ts-ignore - Leaflet se carga dinámicamente
      const L = (await import('leaflet')).default;

      // Limpiar mapa existente
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Calcular centro
      if (trackingData.points.length === 0) {
        setError('No hay puntos de ubicación registrados');
        return;
      }

      const center = trackingData.points[Math.floor(trackingData.points.length / 2)];
      const map = L.map(mapContainerRef.current).setView(
        [center.latitude, center.longitude],
        14
      );

      mapRef.current = map;

      // Agregar tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Agregar puntos
      const latlngs = trackingData.points.map(p => [p.latitude, p.longitude] as [number, number]);

      // Polilínea de la ruta
      L.polyline(latlngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1.0,
      }).addTo(map);
      
      // Punto inicial
      if (trackingData.points.length > 0) {
        const start = trackingData.points[0];
        L.circleMarker([start.latitude, start.longitude], {
          radius: 8,
          fillColor: '#10b981',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<strong>Inicio</strong><br/>${new Date(start.timestamp).toLocaleTimeString()}`
          )
          .addTo(map);
      }
  
      // Punto final
      if (trackingData.points.length > 1) {
        const end = trackingData.points[trackingData.points.length - 1];
        L.circleMarker([end.latitude, end.longitude], {
          radius: 8,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<strong>Fin</strong><br/>${new Date(end.timestamp).toLocaleTimeString()}`
          )
          .addTo(map);
      }
  
      // Ajustar vista
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });

      // Invalidate size just in case
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (err) {
      console.error('Error getting leaflet:', err);
    }
  };

  const downloadGPX = () => {
    if (!session || session.points.length === 0) return;

    const gpxContent = generateGPX(session);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruta_${session.sessionId}_${new Date().toISOString().split('T')[0]}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateGPX = (trackingData: TrackingSession): string => {
    const timestamp = new Date().toISOString();
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Sistema Cobranza">
  <metadata>
    <time>${timestamp}</time>
    <name>Ruta ${trackingData.sessionId}</name>
  </metadata>
  <trk>
    <name>Ruta de cobranza</name>
    <trkseg>`;

    trackingData.points.forEach(point => {
      gpx += `
      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <time>${point.timestamp}</time>
        <accuracy>${point.accuracy}</accuracy>
      </trkpt>`;
    });

    gpx += `
    </trkseg>
  </trk>
</gpx>`;

    return gpx;
  };

  const formatDuration = (start: string, end?: string): string => {
    if (!end) return 'En progreso';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.floor((endTime - startTime) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>Visualización de Ruta</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Cargando ruta...</p>
          </div>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  if (error) {
    return (
      <SimpleCard>
        <SimpleCardHeader>
          <SimpleCardTitle>Visualización de Ruta</SimpleCardTitle>
        </SimpleCardHeader>
        <SimpleCardContent className="flex items-center justify-center h-96">
          <p className="text-red-600">{error}</p>
        </SimpleCardContent>
      </SimpleCard>
    );
  }

  return (
    <SimpleCard>
      <SimpleCardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <SimpleCardTitle>Visualización de Ruta</SimpleCardTitle>
            <SimpleCardDescription>
              {session && `Sesión ${session.sessionId.slice(-8)}`}
            </SimpleCardDescription>
          </div>
          {session && (
            <SimpleButton
              onClick={downloadGPX}
              className="gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <Download className="w-4 h-4 inline" />
              Descargar GPX
            </SimpleButton>
          )}
        </div>
      </SimpleCardHeader>
      <SimpleCardContent className="space-y-4">
        {/* Mapa */}
        <div
          ref={mapContainerRef}
          className="w-full h-96 rounded-lg border border-gray-200"
        />

        {/* Estadísticas */}
        {session && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Duración</span>
              </div>
              <p className="font-semibold text-lg">
                {formatDuration(session.startTime, session.endTime)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Distancia</span>
              </div>
              <p className="font-semibold text-lg">
                {session.totalDistance.toFixed(2)} km
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Puntos registrados</span>
              </div>
              <p className="font-semibold text-lg">
                {session.points.length} puntos
              </p>
            </div>
          </div>
        )}

        {/* Detalles de tiempo */}
        {session && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Inicio:</span>
              <span className="font-medium">
                {new Date(session.startTime).toLocaleString()}
              </span>
            </div>
            {session.endTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fin:</span>
                <span className="font-medium">
                  {new Date(session.endTime).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );
};
