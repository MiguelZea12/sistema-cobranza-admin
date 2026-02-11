'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { Loader2, MapPin, Clock, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import { TrackingMap } from '@/components/TrackingMap';

// Componentes UI simples
interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<CardProps> = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
);

const Badge: React.FC<CardProps> = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Button: React.FC<{ children?: React.ReactNode; onClick?: () => void; variant?: string; className?: string }> = ({
  children,
  onClick,
  variant = 'default',
  className = '',
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      variant === 'outline'
        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
  >
    {children}
  </button>
);

const CardWithClick: React.FC<{ children?: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className = '',
  onClick,
}) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const BadgeWithVariant: React.FC<{ children?: React.ReactNode; variant?: string; className?: string }> = ({
  children,
  variant = 'default',
  className = '',
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      variant === 'outline'
        ? 'bg-gray-100 text-gray-800 border border-gray-300'
        : 'bg-green-100 text-green-800'
    } ${className}`}
  >
    {children}
  </span>
);

interface TrackingPoint {
  latitude: number;
  longitude: number;
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
}

export default function CobradorTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cobradorId = params.id as string;
  const dateParam = searchParams.get('date');
  
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null); // Guardar objeto completo
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [cobradorInfo, setCobradorInfo] = useState<{ nombre: string; codigo: string } | null>(null);

  useEffect(() => {
    loadCobradorInfo();
  }, [cobradorId]);

  useEffect(() => {
    if (cobradorId) {
      loadTracking();
    }
  }, [cobradorId, date]);

  const loadCobradorInfo = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Error al cargar información');
      const data = await response.json();
      const cobrador = data.find((c: any) => c.id === cobradorId);
      if (cobrador) {
        setCobradorInfo({
          nombre: cobrador.usuario,
          codigo: cobrador.codigo || cobrador.codigoUsuario,
        });
      }
    } catch (err) {
      console.error('Error cargando info del cobrador:', err);
    }
  };

  const loadTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tracking?userId=${cobradorId}&date=${date}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos');
      }

      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error:', message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('es-ES');
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('es-ES');
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
    <>
      
    <div className="space-y-4 sm:space-y-6">
      {/* Header con botón de regresar */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/dashboard/tracking"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {cobradorInfo ? `Tracking - ${cobradorInfo.nombre}` : 'Tracking de Ruta'}
          </h1>
          {cobradorInfo && (
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Código: {cobradorInfo.codigo}
            </p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end overflow-hidden">
            <div className="flex-1 min-w-0 max-w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full max-w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-ellipsis"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-2 flex-shrink-0">
              <Clock className="w-4 h-4" />
              <span className="whitespace-nowrap">Mostrando día completo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar mapa si hay una sesión seleccionada */}
      {selectedSession && (
        <div className="space-y-4 relative z-0">
          <div className="overflow-hidden">
            <TrackingMap session={selectedSession} />
          </div>
          <Button
            onClick={() => setSelectedSession(null)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Volver a listado
          </Button>
        </div>
      )}

      {/* Listado de rutas */}
      {!selectedSession && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Rutas registradas</h2>
            <p className="text-sm text-gray-600">
              {sessions.length} {sessions.length === 1 ? 'ruta' : 'rutas'} encontradas
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-gray-600">Cargando rutas...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    No hay rutas registradas para esta fecha
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    El cobrador debe tener activado el tracking en su app móvil
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <CardWithClick
                  key={session.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-between sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <BadgeWithVariant variant="outline">
                            {session.sessionId ? session.sessionId.slice(-8) : 'N/A'}
                          </BadgeWithVariant>
                          {!session.endTime && (
                            <BadgeWithVariant className="bg-green-100 text-green-800">
                              En progreso
                            </BadgeWithVariant>
                          )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600 flex items-center gap-1 mb-1">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Hora Inicio</span>
                            </p>
                            <p className="font-semibold truncate">
                              {session.startTime ? formatTime(session.startTime) : 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 flex items-center gap-1 mb-1">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Duración</span>
                            </p>
                            <p className="font-semibold truncate">
                              {formatDuration(session.startTime, session.endTime)}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 flex items-center gap-1 mb-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Distancia</span>
                            </p>
                            <p className="font-semibold truncate">
                              {(session.totalDistance || 0).toFixed(2)} km
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Puntos</p>
                            <p className="font-semibold">{(session.points && session.points.length) || 0}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          Registrado: {session.startTime ? formatDate(session.startTime) : 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-start">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </CardWithClick>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
