'use client';

import { DollarSign, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ActividadItemProps {
  tipo: 'cobro' | 'encaje';
  usuario: string;
  monto: number;
  clienteNombre?: string;
  fecha: Date;
  formaPago?: string;
  diferencia?: number;
}

export function ActividadItem({
  tipo,
  usuario,
  monto,
  clienteNombre,
  fecha,
  formaPago,
  diferencia,
}: ActividadItemProps) {
  const formatFecha = (fecha: Date) => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
      {tipo === 'cobro' ? (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-700" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-700" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {tipo === 'cobro' ? (
                <>
                  <span className="font-semibold text-blue-600">{usuario}</span> registró un cobro
                  {formaPago && (
                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {formaPago}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="font-semibold text-blue-600">{usuario}</span> hizo encaje de caja
                  {diferencia !== undefined && diferencia !== 0 && (
                    <span
                      className={`ml-1 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        diferencia > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {diferencia > 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(diferencia).toFixed(2)}
                    </span>
                  )}
                  {diferencia === 0 && (
                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Exacto
                    </span>
                  )}
                </>
              )}
            </p>
            {clienteNombre && (
              <p className="text-xs text-gray-500 mt-0.5">Cliente: {clienteNombre}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatFecha(fecha)}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-bold text-gray-900">${monto.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
