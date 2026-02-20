'use client';

import { useState, useEffect } from 'react';
import { EncajeCaja, DesgloseDenominaciones, ChequeArqueo } from '@/lib/types';
import { X, Save, DollarSign, Plus, Trash2 } from 'lucide-react';

const BANCOS_ECUADOR = [
  'Banco Pichincha', 'Banco de Guayaquil', 'Banco del Pacífico', 'Banco Bolivariano',
  'Banco del Austro', 'Banco Internacional', 'Produbanco', 'Banco de Machala',
  'Banco de Loja', 'Banco Amazonas', 'Banco Económico', 'Banco Capital',
  'Banco Solidario', 'Banco ProCredit', 'BanEcuador',
];

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
  const [cheques, setCheques] = useState<ChequeArqueo[]>(encaje.cheques ?? []);
  const [chequesValorStr, setChequesValorStr] = useState<string[]>((encaje.cheques ?? []).map(c => c.valor.toString()));
  const [tarjeta, setTarjeta] = useState(encaje.tarjeta ?? 0);
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
    setCheques(encaje.cheques ?? []);
    setChequesValorStr((encaje.cheques ?? []).map(c => c.valor.toString()));
    setTarjeta(encaje.tarjeta ?? 0);
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

  // Actualizar Total Declarado automáticamente
  useEffect(() => {
    const totalCheques = cheques.reduce((sum, c) => sum + c.valor, 0);
    const nuevoTotal = totalEfectivoDesglose + transferencia + totalCheques + tarjeta;
    setTotalDeclarado(nuevoTotal);
    setEfectivo(totalEfectivoDesglose);
  }, [desglose, transferencia, cheques, tarjeta, totalEfectivoDesglose]);

  const nuevaDiferencia = totalDeclarado - encaje.totalCobrado;

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
          cheques: cheques.length > 0 ? cheques : [],
          totalCheques: cheques.reduce((sum, c) => sum + c.valor, 0),
          tarjeta,
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
                    ${encaje.totalCobrado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Efectivo Cobrado:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    ${encaje.efectivoCobrado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Transferencia Cobrado:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    ${encaje.transferenciaCobrado.toFixed(2)}
                  </span>
                </div>
                {(encaje.chequeCobrado ?? 0) > 0 && (
                  <div>
                    <span className="text-gray-600">Cheque Cobrado:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${(encaje.chequeCobrado ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {(encaje.tarjetaCobrado ?? 0) > 0 && (
                  <div>
                    <span className="text-gray-600">Tarjeta Cobrado:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${(encaje.tarjetaCobrado ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {(encaje.totalCheques ?? 0) > 0 && (
                  <div>
                    <span className="text-gray-600">Cheques Declarados:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${(encaje.totalCheques ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {(encaje.tarjeta ?? 0) > 0 && (
                  <div>
                    <span className="text-gray-600">Tarjeta Declarada:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${(encaje.tarjeta ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
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
                Este valor se actualiza automáticamente según el desglose + transferencia + cheques + tarjeta
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
                    { label: '$100', key: 'cien', value: 100 },
                    { label: '$50', key: 'cincuenta', value: 50 },
                    { label: '$20', key: 'veinte', value: 20 },
                    { label: '$10', key: 'diez', value: 10 },
                    { label: '$5', key: 'cinco', value: 5 },
                    { label: '$1', key: 'uno', value: 1 },
                  ].map((billete) => (
                    <div key={billete.key}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {billete.label} × {desglose.billetes[billete.key as keyof typeof desglose.billetes]} = $
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
                    { label: '$1.00', key: 'un_dolar', value: 1.0 },
                    { label: '$0.50', key: 'cincuenta_centavos', value: 0.5 },
                    { label: '$0.25', key: 'veinticinco_centavos', value: 0.25 },
                    { label: '$0.10', key: 'diez_centavos', value: 0.1 },
                    { label: '$0.05', key: 'cinco_centavos', value: 0.05 },
                    { label: '$0.01', key: 'un_centavo', value: 0.01 },
                  ].map((moneda) => (
                    <div key={moneda.key}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {moneda.label} × {desglose.monedas[moneda.key as keyof typeof desglose.monedas]} = $
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
                    ${totalEfectivoDesglose.toFixed(2)}
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

            {/* Cheques */}
            <div className="border border-sky-200 rounded-lg p-4 bg-sky-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sky-800">Cheques Recibidos ({cheques.length})</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCheques([...cheques, { banco: '', numeroCheque: '', valor: 0 }]);
                    setChequesValorStr([...chequesValorStr, '']);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Agregar
                </button>
              </div>

              {cheques.length === 0 && (
                <p className="text-sm text-sky-600 italic text-center py-2">Sin cheques. Presiona "Agregar" para añadir.</p>
              )}

              {cheques.map((cheque, index) => (
                <div key={index} className="bg-white border border-sky-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-sky-700">Cheque #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const n = [...cheques]; n.splice(index, 1); setCheques(n);
                        const ns = [...chequesValorStr]; ns.splice(index, 1); setChequesValorStr(ns);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Banco</label>
                      <select
                        value={cheque.banco}
                        onChange={(e) => {
                          const n = [...cheques]; n[index] = { ...n[index], banco: e.target.value }; setCheques(n);
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Seleccionar banco</option>
                        {BANCOS_ECUADOR.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">N° Cheque</label>
                      <input
                        type="text"
                        value={cheque.numeroCheque}
                        onChange={(e) => {
                          const n = [...cheques]; n[index] = { ...n[index], numeroCheque: e.target.value }; setCheques(n);
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        placeholder="Número de cheque"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valor</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={chequesValorStr[index] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
                          const ns = [...chequesValorStr]; ns[index] = val; setChequesValorStr(ns);
                          const n = [...cheques]; n[index] = { ...n[index], valor: parseFloat(val) || 0 }; setCheques(n);
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {cheques.length > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-sky-200 mt-1">
                  <span className="text-sm font-semibold text-sky-800">Total Cheques:</span>
                  <span className="text-base font-bold text-sky-700">
                    ${cheques.reduce((s, c) => s + c.valor, 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Tarjeta de Crédito */}
            <div>
              <label htmlFor="tarjeta" className="block text-sm font-medium text-gray-700 mb-2">
                Tarjeta de Crédito
              </label>
              <input
                type="number"
                id="tarjeta"
                step="0.01"
                min="0"
                value={tarjeta}
                onChange={(e) => setTarjeta(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
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
                  {nuevaDiferencia > 0 ? '+' : nuevaDiferencia < 0 ? '-' : ''}${Math.abs(nuevaDiferencia).toFixed(2)}
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
