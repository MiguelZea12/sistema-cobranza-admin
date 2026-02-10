'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Calendar, User, ChevronRight, Loader2 } from 'lucide-react';

interface CobradorConTracking {
  id: string;
  codigo: string;
  nombre: string;
  ultimaRuta?: {
    fecha: string;
    distancia: number;
    duracion: string;
  };
}

export default function TrackingPage() {
  const [cobradores, setCobradores] = useState<CobradorConTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCobradores();
  }, []);

  const fetchCobradores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Error al cargar cobradores');
      
      const data = await response.json();
      
      // Filtrar solo usuarios que son cobradores
      // Si no existe el campo 'cobradores', mostrar todos los usuarios
      const cobradoresData = data.filter((u: any) => {
        // Si tiene el campo cobradores definido, verificar que sea 1
        if (u.cobradores !== undefined) {
          return u.cobradores === 1 || u.cobradores === '1';
        }
        // Si no tiene el campo cobradores, incluir el usuario (todos son cobradores por defecto)
        return true;
      });
      
      setCobradores(cobradoresData.map((c: any) => ({
        id: c.id,
        codigo: c.codigo || c.codigoUsuario,
        nombre: c.usuario,
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tracking de Rutas</h1>
          <p className="text-gray-600 mt-1">
            Visualiza las rutas de tus cobradores en tiempo real
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Rutas del día completo</span>
          </div>
        </div>
      </div>

      {/* Lista de Cobradores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cobradores Activos</h2>
          <p className="text-sm text-gray-600 mt-1">
            Haz clic en un cobrador para ver su ruta del día
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-gray-600">Cargando cobradores...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : cobradores.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No hay cobradores registrados</p>
            </div>
          ) : (
            cobradores.map((cobrador) => (
              <Link
                key={cobrador.id}
                href={`/dashboard/tracking/${cobrador.id}?date=${selectedDate}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar/Ícono */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Información del cobrador */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{cobrador.nombre}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {cobrador.codigo}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Ver ruta del día</span>
                        </div>
                        {cobrador.ultimaRuta && (
                          <>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{cobrador.ultimaRuta.duracion}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{cobrador.ultimaRuta.distancia.toFixed(1)} km</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Ver tracking
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">¿Cómo funciona el tracking?</h4>
            <p className="text-sm text-blue-700">
              Las rutas se registran automáticamente desde la app móvil de cada cobrador. 
              Puedes ver el recorrido completo del día, incluyendo puntos de parada, distancia recorrida y tiempo total.
              Los datos se actualizan en tiempo real durante todo el día.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
