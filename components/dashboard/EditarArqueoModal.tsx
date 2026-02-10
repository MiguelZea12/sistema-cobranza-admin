'use client';

import { useState, useEffect } from 'react';
import { EncajeCaja, DesgloseDenominaciones } from '@/lib/types';
import { X, Save, DollarSign } from 'lucide-react';

interface EditarArqueoModalProps {
  encaje: EncajeCaja;
  isOpen: boolean;
  onClose: () => void;
  onSave: (encajeActualizado: EncajeCaja) => void;
}

export default function EditarArqueoModal({ encaje, isOpen, onClose, onSave }: EditarArqueoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [totalDeclarado, setTotalDeclarado] = useState(encaje.totalDeclarado);
  const [efectivo, setEfectivo] = useState(encaje.efectivo);
  const [transferencia, setTransferencia] = useState(encaje.transferencia);
  const [observaciones, setObservaciones] = useState(encaje.observaciones || '');

  // Desglose de denominaciones
  const [desglose, setDesglose] = useState<DesgloseDenominaciones>(
    encaje.desglose || {
      billetes: {
        cien: 0,
        cincuenta: 0,
        veinte: 0,
        diez: 0,
        cinco: 0,
        uno: 0,
      },
      monedas: {
        un_dolar: 0,
        cincuenta_centavos: 0,
        veinticinco_centavos: 0,
        diez_centavos: 0,
        cinco_centavos: 0,
        un_centavo: 0,
      },
    }
  );

  // Calcular total del desglose
  const calcularTotalDesglose = () => {
    const totalBilletes =
      desglose.billetes.cien * 100 +
      desglose.billetes.cincuenta * 50 +
      desglose.billetes.veinte * 20 +
      desglose.billetes.diez * 10 +
      desglose.billetes.cinco * 5 +
      desglose.billetes.uno * 1;

    const totalMonedas =
      desglose.monedas.un_dolar * 1.0 +
      desglose.monedas.cincuenta_centavos * 0.5 +
      desglose.monedas.veinticinco_centavos * 0.25 +
      desglose.monedas.diez_centavos * 0.1 +
      desglose.monedas.cinco_centavos * 0.05 +
      desglose.monedas.un_centavo * 0.01;

    return totalBilletes + totalMonedas;
  };

  const totalEfectivoDesglose = calcularTotalDesglose();

  // Actualizar valores cuando cambia el encaje
  useEffect(() => {
    setTotalDeclarado(encaje.totalDeclarado);
    setEfectivo(encaje.efectivo);
    setTransferencia(encaje.transferencia);
    setObservaciones(encaje.observaciones || '');
    setDesglose(
      encaje.desglose || {
        billetes: {
          cien: 0,
          cincuenta: 0,
          veinte: 0,
          diez: 0,
          cinco: 0,
          uno: 0,
        },
        monedas: {
          un_dolar: 0,
          cincuenta_centavos: 0,
          veinticinco_centavos: 0,
          diez_centavos: 0,
          cinco_centavos: 0,
          un_centavo: 0,
        },
      }
    );
  }, [encaje]);

  // Actualizar Total Declarado automáticamente al cambiar desglose o transferencia
  useEffect(() => {
    const nuevoTotal = totalEfectivoDesglose + transferencia;
    setTotalDeclarado(nuevoTotal);
    setEfectivo(totalEfectivoDesglose);
  }, [desglose, transferencia, totalEfectivoDesglose]);

  const nuevaDiferencia = encaje.totalCobrado - totalDeclarado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/encajes/${encaje.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalDeclarado,
          efectivo,
          transferencia,
          desglose,
          observaciones,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar arqueo');
      }

      const encajeActualizado = await response.json();
      onSave(encajeActualizado);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Editar Arqueo</h2>
              <p className="text-sm text-blue-100">{encaje.usuarioNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Información no editable */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Total Cobrado:</span>
                  <span className="ml-2 font-bold text-gray-900">
                    C${encaje.totalCobrado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Efectivo Cobrado:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    C${encaje.efectivoCobrado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Transferencia Cobrado:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    C${encaje.transferenciaCobrado.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Declarado */}
            <div>
              <label htmlFor="totalDeclarado" className="block text-sm font-medium text-gray-700 mb-2">
                Total Declarado (Calculado automáticamente)
              </label>
              <input
                type="number"
                id="totalDeclarado"
                step="0.01"
                value={totalDeclarado.toFixed(2)}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-bold cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este valor se actualiza automáticamente según el desglose + transferencia
              </p>
            </div>

            {/* Desglose de efectivo */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Desglose de Efectivo</h3>
              
              {/* Billetes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Billetes</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'C$100', key: 'cien', value: 100 },
                    { label: 'C$50', key: 'cincuenta', value: 50 },
                    { label: 'C$20', key: 'veinte', value: 20 },
                    { label: 'C$10', key: 'diez', value: 10 },
                    { label: 'C$5', key: 'cinco', value: 5 },
                    { label: 'C$1', key: 'uno', value: 1 },
                  ].map((billete) => (
                    <div key={billete.key}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {billete.label} × {desglose.billetes[billete.key as keyof typeof desglose.billetes]} = C$
                        {(billete.value * desglose.billetes[billete.key as keyof typeof desglose.billetes]).toFixed(2)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={desglose.billetes[billete.key as keyof typeof desglose.billetes]}
                        onChange={(e) =>
                          setDesglose({
                            ...desglose,
                            billetes: {
                              ...desglose.billetes,
                              [billete.key]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Monedas */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Monedas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'C$1.00', key: 'un_dolar', value: 1.0 },
                    { label: 'C$0.50', key: 'cincuenta_centavos', value: 0.5 },
                    { label: 'C$0.25', key: 'veinticinco_centavos', value: 0.25 },
                    { label: 'C$0.10', key: 'diez_centavos', value: 0.1 },
                    { label: 'C$0.05', key: 'cinco_centavos', value: 0.05 },
                    { label: 'C$0.01', key: 'un_centavo', value: 0.01 },
                  ].map((moneda) => (
                    <div key={moneda.key}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {moneda.label} × {desglose.monedas[moneda.key as keyof typeof desglose.monedas]} = C$
                        {(moneda.value * desglose.monedas[moneda.key as keyof typeof desglose.monedas]).toFixed(2)}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={desglose.monedas[moneda.key as keyof typeof desglose.monedas]}
                        onChange={(e) =>
                          setDesglose({
                            ...desglose,
                            monedas: {
                              ...desglose.monedas,
                              [moneda.key]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total del desglose */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total Efectivo (Desglose):</span>
                  <span className="text-lg font-bold text-blue-700">
                    C${totalEfectivoDesglose.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transferencia */}
            <div>
              <label htmlFor="transferencia" className="block text-sm font-medium text-gray-700 mb-2">
                Transferencia
              </label>
              <input
                type="number"
                id="transferencia"
                step="0.01"
                value={transferencia}
                onChange={(e) => setTransferencia(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notas adicionales sobre el arqueo..."
              />
            </div>

            {/* Diferencia proyectada */}
            <div
              className={`rounded-lg p-4 border ${
                nuevaDiferencia > 0
                  ? 'bg-green-50 border-green-200'
                  : nuevaDiferencia < 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Nueva Diferencia:</span>
                <span
                  className={`text-xl font-bold ${
                    nuevaDiferencia > 0
                      ? 'text-green-600'
                      : nuevaDiferencia < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {nuevaDiferencia > 0 ? '+' : ''}C${nuevaDiferencia.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {nuevaDiferencia > 0
                  ? 'Sobrante'
                  : nuevaDiferencia < 0
                  ? 'Faltante'
                  : 'Exacto'}
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
