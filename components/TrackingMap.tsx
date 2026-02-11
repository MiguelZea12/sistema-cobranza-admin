'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, MapPin, Clock, AlertTriangle, Gauge, TrendingUp, Zap, AlertOctagon, Rocket, Pause, DollarSign, Timer, Play, Flag } from 'lucide-react';
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

type DrivingEventType = 
  | 'SPEED_VIOLATION'
  | 'HARSH_BRAKE'
  | 'RAPID_ACCELERATION'
  | 'PHONE_USE'
  | 'START_TRIP'
  | 'END_TRIP'
  | 'STATIONARY'
  | 'PAYMENT';

interface DrivingEvent {
  type: DrivingEventType;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed?: number;
  value?: number;
  metadata?: {
    clienteNombre?: string;
    montoPagado?: number;
    formaPago?: 'efectivo' | 'transferencia';
    numeroComprobante?: string;
  };
}

interface TrackingPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  isStationary?: boolean;
  event?: DrivingEvent;
}

interface TrackingSession {
  id: string;
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  points: TrackingPoint[];
  events?: DrivingEvent[];
  totalDistance: number;
  maxSpeed?: number;
  averageSpeed?: number;
  createdAt: string;
}

interface TrackingMapProps {
  session: TrackingSession; // Recibir sesión completa en lugar de hacer fetch
  onDataLoaded?: (session: TrackingSession) => void;
}

// Punto de parada: cuando alguien estuvo estático 5+ minutos
interface StopPoint {
  latitude: number;
  longitude: number;
  arrivedAt: string;   // hora que llegó
  departedAt: string;  // hora que se fue
  durationMinutes: number; // cuántos minutos estuvo
}

// Distancia haversine en metros
const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Detecta puntos de parada analizando los puntos de tracking.
 * Una parada = persona estuvo dentro de un radio de 30m por 5+ minutos.
 */
const detectStopPoints = (points: TrackingPoint[]): StopPoint[] => {
  if (points.length < 10) return [];

  const MIN_STOP_MINUTES = 5;   // mínimo 5 min para contar como parada
  const RADIUS_METERS = 30;     // radio de agrupación
  const stops: StopPoint[] = [];

  let clusterStart = 0;

  for (let i = 1; i <= points.length; i++) {
    // Si llegamos al final o el punto actual se salió del radio del cluster
    const outOfRadius =
      i < points.length &&
      haversineMeters(
        points[clusterStart].latitude,
        points[clusterStart].longitude,
        points[i].latitude,
        points[i].longitude
      ) > RADIUS_METERS;

    if (i === points.length || outOfRadius) {
      // Evaluar el cluster [clusterStart .. i-1]
      const startTime = new Date(points[clusterStart].timestamp).getTime();
      const endTime = new Date(points[i - 1].timestamp).getTime();
      const durationMin = (endTime - startTime) / 60000;

      if (durationMin >= MIN_STOP_MINUTES) {
        // Promediar lat/lng del cluster
        let sumLat = 0, sumLng = 0;
        for (let j = clusterStart; j < i; j++) {
          sumLat += points[j].latitude;
          sumLng += points[j].longitude;
        }
        const count = i - clusterStart;

        stops.push({
          latitude: sumLat / count,
          longitude: sumLng / count,
          arrivedAt: points[clusterStart].timestamp,
          departedAt: points[i - 1].timestamp,
          durationMinutes: Math.round(durationMin),
        });
      }

      clusterStart = i;
    }
  }

  return stops;
};

/**
 * Filtra puntos para eliminar el "ruido" del GPS cuando alguien está quieto.
 * Solo incluye puntos que se mueven más de 10 metros del punto anterior.
 * Esto evita el efecto de "zigzag" cuando alguien está estático.
 */
const filterStationaryNoise = (points: TrackingPoint[]): TrackingPoint[] => {
  if (points.length === 0) return [];
  
  const MIN_MOVEMENT_METERS = 10; // Mínimo movimiento para considerar el punto
  const filtered: TrackingPoint[] = [points[0]]; // Siempre incluir el primer punto
  
  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    const last = filtered[filtered.length - 1];
    
    // Si está marcado explícitamente como estacionario, saltarlo
    if (current.isStationary) {
      continue;
    }
    
    // Calcular distancia desde el último punto agregado
    const distance = haversineMeters(
      last.latitude,
      last.longitude,
      current.latitude,
      current.longitude
    );
    
    // Solo agregar si se movió lo suficiente O si es el último punto
    if (distance >= MIN_MOVEMENT_METERS || i === points.length - 1) {
      filtered.push(current);
    }
  }
  
  return filtered;
};

export const TrackingMap: React.FC<TrackingMapProps> = ({ session: sessionProp, onDataLoaded }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const session = sessionProp; // Usar la sesión recibida directamente

  // Marcar que el componente está montado (solo en cliente)
  useEffect(() => {
    setIsMounted(true);
    
    // Cleanup cuando el componente se desmonta completamente
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.stop();
          mapRef.current.off();
          mapRef.current.remove();
        } catch (err) {
          // Silenciar errores de limpieza
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Notificar datos cargados (ya vienen como prop)
  useEffect(() => {
    if (session && onDataLoaded) {
      onDataLoaded(session);
    }
  }, [session, onDataLoaded]);

  // Renderizar mapa cuando esté montado
  useEffect(() => {
    if (!isMounted || !session) return;
    
    let isCancelled = false;

    const cleanupMap = () => {
      if (mapRef.current) {
        try {
          // Detener todas las animaciones
          mapRef.current.stop();
          // Remover el mapa
          mapRef.current.off();
          mapRef.current.remove();
        } catch (err) {
          // Silenciar errores de limpieza
        }
        mapRef.current = null;
      }
    };
    
    const renderMap = async () => {
      if (isCancelled) return;
      
      try {
        // Limpiar mapa existente antes de crear uno nuevo
        cleanupMap();

        // Verificar que el contenedor aún existe
        if (!mapContainerRef.current) {
          return;
        }

        // Verificar que el elemento tiene dimensiones
        const containerElement = mapContainerRef.current as HTMLDivElement;
        if (!containerElement || containerElement.offsetHeight === 0) {
          // Reintentar en 500ms
          const retryTimer = setTimeout(() => {
            if (!isCancelled) renderMap();
          }, 500);
          return;
        }

        if (isCancelled) return;

        // @ts-ignore - Leaflet se carga dinámicamente
        const L = (await import('leaflet')).default;

        // Calcular centro
        if (session.points.length === 0) {
          setError('No hay puntos de ubicación registrados');
          return;
        }

        // FILTRAR RUIDO DE GPS - Esto elimina el efecto de zigzag cuando está quieto
        const filteredPoints = filterStationaryNoise(session.points);

        if (filteredPoints.length === 0) {
          setError('No hay puntos válidos después de filtrar');
          return;
        }

        const center = filteredPoints[Math.floor(filteredPoints.length / 2)];
        const map = L.map(containerElement, {
          zoomControl: true,
          attributionControl: true,
          zoomAnimation: false, // Deshabilitar animaciones de zoom para evitar errores
          fadeAnimation: false,
          markerZoomAnimation: false,
          preferCanvas: true, // Usar canvas en lugar de SVG para mejor rendimiento
        }).setView(
          [center.latitude, center.longitude],
          15,
          { animate: false } // No animar el setView inicial
        );

        mapRef.current = map;

        // Agregar tile layer con mejor calidad
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 3,
        }).addTo(map);

        // Preparar puntos FILTRADOS para la polilínea (sin ruido cuando está quieto)
        const latlngs = filteredPoints.map(p => [p.latitude, p.longitude] as [number, number]);

        // Polilínea principal - estilo tipo Life360
        const mainPolyline = L.polyline(latlngs, {
          color: '#8B5CF6', // Morado vibrante
          weight: 6,
          opacity: 0.9,
          smoothFactor: 1.5,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        
        // Agregar borde blanco para efecto 3D
        L.polyline(latlngs, {
          color: '#FFFFFF',
          weight: 8,
          opacity: 0.5,
          smoothFactor: 1.5,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map).bringToBack();
        
        // Punto inicial con icono personalizado (usar trackingData.points original)
        if (session.points.length > 0) {
          const start = session.points[0];
          const startIcon = L.divIcon({
            className: 'custom-start-marker',
            html: `
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
              ">▶</div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          
          L.marker([start.latitude, start.longitude], { icon: startIcon })
            .bindPopup(`
              <div style="min-width: 150px;">
                <strong style="color: #10b981;">▶ Inicio</strong><br/>
                <small>${new Date(start.timestamp).toLocaleString()}</small>
              </div>
            `)
            .addTo(map);
        }
    
        // Punto final (usar trackingData.points original)
        if (session.points.length > 1) {
          const end = session.points[session.points.length - 1];
          const endIcon = L.divIcon({
            className: 'custom-end-marker',
            html: `
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
              ">■</div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          
          L.marker([end.latitude, end.longitude], { icon: endIcon })
            .bindPopup(`
              <div style="min-width: 150px;">
                <strong style="color: #ef4444;">■ Fin</strong><br/>
                <small>${new Date(end.timestamp).toLocaleString()}</small>
              </div>
            `)
            .addTo(map);
        }
        
        // Agregar marcadores para eventos importantes
        const events = session.events || [];
        events.forEach((event) => {
          let iconHtml = '';
          let popupContent = '';
          let iconColor = '#6b7280';
          
          switch (event.type) {
            case 'SPEED_VIOLATION':
              iconColor = '#ef4444';
              iconHtml = `
                <div style="
                  width: 28px;
                  height: 28px;
                  background: ${iconColor};
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 14px;
                ">⚡</div>
              `;
              popupContent = `
                <div style="min-width: 180px;">
                  <strong style="color: ${iconColor};">⚡ Exceso de Velocidad</strong><br/>
                  <small>Velocidad: ${event.speed?.toFixed(0)} km/h</small><br/>
                  <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                </div>
              `;
              break;
              
            case 'HARSH_BRAKE':
              iconColor = '#f59e0b';
              iconHtml = `
                <div style="
                  width: 28px;
                  height: 28px;
                  background: ${iconColor};
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 14px;
                ">!</div>
              `;
              popupContent = `
                <div style="min-width: 180px;">
                  <strong style="color: ${iconColor};">! Frenado Brusco</strong><br/>
                  <small>Intensidad: ${event.value?.toFixed(1)} m/s²</small><br/>
                  <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                </div>
              `;
              break;
              
            case 'RAPID_ACCELERATION':
              iconColor = '#3b82f6';
              iconHtml = `
                <div style="
                  width: 28px;
                  height: 28px;
                  background: ${iconColor};
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 14px;
                ">↑</div>
              `;
              popupContent = `
                <div style="min-width: 180px;">
                  <strong style="color: ${iconColor};">↑ Aceleración Rápida</strong><br/>
                  <small>Aceleración: ${event.value?.toFixed(1)} m/s²</small><br/>
                  <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                </div>
              `;
              break;
              
            case 'STATIONARY':
              iconColor = '#8b5cf6';
              iconHtml = `
                <div style="
                  width: 24px;
                  height: 24px;
                  background: ${iconColor};
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 12px;
                ">⏸</div>
              `;
              popupContent = `
                <div style="min-width: 150px;">
                  <strong style="color: ${iconColor};">⏸ Detenido</strong><br/>
                  <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                </div>
              `;
              break;
              
            case 'PAYMENT':
              iconColor = '#10b981';
              iconHtml = `
                <div style="
                  width: 32px;
                  height: 32px;
                  background: ${iconColor};
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 18px;
                  font-weight: bold;
                ">$</div>
              `;
              popupContent = `
                <div style="min-width: 200px;">
                  <strong style="color: ${iconColor};">$ Pago Registrado</strong><br/>
                  ${event.metadata?.clienteNombre ? `<small><strong>Cliente:</strong> ${event.metadata.clienteNombre}</small><br/>` : ''}
                  ${event.value ? `<small><strong>Monto:</strong> $${event.value.toFixed(2)}</small><br/>` : ''}
                  ${event.metadata?.formaPago ? `<small><strong>Forma:</strong> ${event.metadata.formaPago}</small><br/>` : ''}
                  ${event.metadata?.numeroComprobante ? `<small><strong>Comprobante:</strong> ${event.metadata.numeroComprobante}</small><br/>` : ''}
                  <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                </div>
              `;
              break;
          }
          
          if (iconHtml && popupContent) {
            const eventIcon = L.divIcon({
              className: 'custom-event-marker',
              html: iconHtml,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            
            L.marker([event.latitude, event.longitude], { icon: eventIcon })
              .bindPopup(popupContent)
              .addTo(map);
          }
        });
    
        // ===== PUNTOS DE PARADA (5+ min estático) =====
        const stopPoints = detectStopPoints(session.points);
        stopPoints.forEach((stop, idx) => {
          const formatTime = (ts: string) =>
            new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const durText = stop.durationMinutes >= 60
            ? `${Math.floor(stop.durationMinutes / 60)}h ${stop.durationMinutes % 60}m`
            : `${stop.durationMinutes} min`;

          const stopIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `
              <div style="
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #dc2626, #991b1b);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(220,38,38,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
                cursor: pointer;
              ">⏱</div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const tooltipContent = `
            <div style="text-align:center; min-width:140px; padding:4px;">
              <div style="font-weight:700; font-size:14px; color:#dc2626; margin-bottom:4px;">⏱ Parada #${idx + 1}</div>
              <div style="font-size:22px; font-weight:800; color:#111;">${durText}</div>
              <div style="margin-top:4px; font-size:12px; color:#555;">
                ${formatTime(stop.arrivedAt)} → ${formatTime(stop.departedAt)}
              </div>
            </div>
          `;

          L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
            .bindTooltip(tooltipContent, {
              direction: 'top',
              offset: [0, -20],
              className: 'stop-tooltip',
              permanent: false,
            })
            .bindPopup(`
              <div style="min-width:180px;">
                <strong style="color:#dc2626;">⏱ Parada #${idx + 1}</strong><br/>
                <div style="margin:6px 0;">
                  <strong style="font-size:16px;">${durText}</strong> detenido
                </div>
                <small>Llegó: ${formatTime(stop.arrivedAt)}</small><br/>
                <small>Salió: ${formatTime(stop.departedAt)}</small>
              </div>
            `)
            .addTo(map);
        });

        // Ajustar vista para incluir todos los puntos
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { 
          padding: [50, 50], 
          maxZoom: 16,
          animate: false // No animar el fitBounds
        });

        // Invalidate size
        setTimeout(() => {
          if (!isCancelled && mapRef.current) {
            try {
              mapRef.current.invalidateSize();
            } catch (err) {
              // Ignorar errores si el mapa ya fue destruido
            }
          }
        }, 100);

      } catch (err) {
        if (!isCancelled) {
          console.error('❌ Error renderizando mapa:', err);
          setError(`Error al renderizar el mapa: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }
    };

    renderMap();

    // Cleanup al desmontar o cambiar sesión
    return () => {
      isCancelled = true;
      cleanupMap();
    };
  }, [isMounted, session]);

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

  return (
    <SimpleCard>
      <SimpleCardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <SimpleCardTitle>Visualización de Ruta</SimpleCardTitle>
            <SimpleCardDescription>
              {session && `Sesión ${session.sessionId.slice(-8)}`}
            </SimpleCardDescription>
          </div>
          {session && (
            <SimpleButton
              onClick={downloadGPX}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              <Download className="w-4 h-4 inline" />
              Descargar GPX
            </SimpleButton>
          )}
        </div>
      </SimpleCardHeader>
      <SimpleCardContent className="space-y-4 sm:space-y-6">
        {/* Mapa */}
        <div
          ref={mapContainerRef}
          className="w-full rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden bg-gray-100"
          style={{ height: '400px', minHeight: '300px' }}
          data-map-container="tracking"
        />

        {/* Estado del Mapa */}
        <div className="text-xs text-gray-500 flex justify-between items-center">
          <span>Estado: {isMounted ? 'Cliente Montado' : 'Inicializando'}</span>
          <span>Puntos: {session?.points.length || 0}</span>
        </div>

        {/* Estadísticas Principales - Estilo Life360 */}
        {session && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-700 mb-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">Duración</span>
              </div>
              <p className="font-bold text-xl sm:text-2xl text-blue-900 truncate">
                {formatDuration(session.startTime, session.endTime)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-700 mb-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">Distancia</span>
              </div>
              <p className="font-bold text-xl sm:text-2xl text-purple-900 truncate">
                {session.totalDistance.toFixed(2)} km
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 mb-2">
                <Gauge className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">Vel. Máx</span>
              </div>
              <p className="font-bold text-xl sm:text-2xl text-green-900 truncate">
                {session.maxSpeed?.toFixed(0) || 0} km/h
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-700 mb-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">Vel. Prom</span>
              </div>
              <p className="font-bold text-xl sm:text-2xl text-orange-900 truncate">
                {session.averageSpeed?.toFixed(0) || 0} km/h
              </p>
            </div>
          </div>
        )}

        {/* Panel de Eventos de Conducción */}
        {session && session.events && session.events.length > 0 && (
          <div className="pt-4 border-t-2">
            <h4 className="font-semibold text-base sm:text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="truncate">Eventos de Conducción ({session.events.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {session.events.map((event, idx) => {
                let bgColor = 'bg-gray-50';
                let borderColor = 'border-gray-300';
                let textColor = 'text-gray-700';
                let IconComponent = MapPin;
                let title = 'Evento';
                let detail = '';

                switch (event.type) {
                  case 'SPEED_VIOLATION':
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-300';
                    textColor = 'text-red-700';
                    IconComponent = Zap;
                    title = 'Exceso de Velocidad';
                    detail = `${event.speed?.toFixed(0)} km/h`;
                    break;
                  case 'HARSH_BRAKE':
                    bgColor = 'bg-amber-50';
                    borderColor = 'border-amber-300';
                    textColor = 'text-amber-700';
                    IconComponent = AlertOctagon;
                    title = 'Frenado Brusco';
                    detail = `${event.value?.toFixed(1)} m/s²`;
                    break;
                  case 'RAPID_ACCELERATION':
                    bgColor = 'bg-blue-50';
                    borderColor = 'border-blue-300';
                    textColor = 'text-blue-700';
                    IconComponent = Rocket;
                    title = 'Aceleración Rápida';
                    detail = `${event.value?.toFixed(1)} m/s²`;
                    break;
                  case 'STATIONARY':
                    bgColor = 'bg-purple-50';
                    borderColor = 'border-purple-300';
                    textColor = 'text-purple-700';
                    IconComponent = Pause;
                    title = 'Detenido';
                    detail = 'Sin movimiento';
                    break;
                  case 'PAYMENT':
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-300';
                    textColor = 'text-green-700';
                    IconComponent = DollarSign;
                    title = 'Pago Registrado';
                    detail = event.value ? `$${event.value.toFixed(2)}` : '';
                    break;
                }

                return (
                  <div
                    key={idx}
                    className={`${bgColor} ${borderColor} border-2 p-3 rounded-lg`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`${textColor}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${textColor}`}>
                          {title}
                        </p>
                        {detail && (
                          <p className={`text-xs ${textColor} font-medium`}>
                            {detail}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel de Paradas (5+ min estático) */}
        {session && (() => {
          const stops = detectStopPoints(session.points);
          if (stops.length === 0) return null;
          const totalStopMin = stops.reduce((a, s) => a + s.durationMinutes, 0);
          const formatTime = (ts: string) =>
            new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div className="pt-4 border-t-2">
              <h4 className="font-semibold text-base sm:text-lg mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>Puntos de Parada ({stops.length})</span>
                </div>
                <span className="text-sm font-normal text-gray-500 sm:ml-auto">
                  Total detenido: {totalStopMin >= 60 ? `${Math.floor(totalStopMin/60)}h ${totalStopMin%60}m` : `${totalStopMin} min`}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stops.map((stop, idx) => {
                  const durText = stop.durationMinutes >= 60
                    ? `${Math.floor(stop.durationMinutes/60)}h ${stop.durationMinutes%60}m`
                    : `${stop.durationMinutes} min`;
                  return (
                    <div
                      key={idx}
                      className="bg-red-50 border-2 border-red-300 p-3 sm:p-4 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
                          <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-red-800 text-sm sm:text-base truncate">Parada #{idx + 1}</p>
                          <p className="font-extrabold text-xl sm:text-2xl text-red-900 truncate">{durText}</p>
                          <p className="text-xs text-red-600 mt-1 truncate">
                            {formatTime(stop.arrivedAt)} → {formatTime(stop.departedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Resumen de Puntos y Tiempo */}
        {session && (
          <div className="pt-4 border-t-2 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-sm text-gray-700 mb-2">Datos de Tracking</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">Puntos capturados:</span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{session.points.length}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">Eventos detectados:</span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{session.events?.length || 0}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">Paradas (5+ min):</span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{detectStopPoints(session.points).length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-sm text-gray-700 mb-2">🕐 Horarios</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">Inicio:</span>
                    <span className="font-semibold text-gray-900 flex-shrink-0">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  {session.endTime && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-600 truncate">Fin:</span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {new Date(session.endTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );
};
