'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Usuario, Cobrador } from '@/lib/types';

interface EditarUsuarioModalProps {
  usuario: Usuario | null;
  onClose: () => void;
  onSave: () => void;
}

const SUCURSALES = ['Esmeralda', 'Jipijapa'];
const CAJAS = ['0001', '0002'];

export default function EditarUsuarioModal({ usuario, onClose, onSave }: EditarUsuarioModalProps) {
  const [sucursal, setSucursal] = useState('');
  const [caja, setCaja] = useState('');
  const [cobrador, setCobrador] = useState('');
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCobradores, setLoadingCobradores] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setSucursal(usuario.sucursal || '');
      setCaja(usuario.caja || '');
      setCobrador(usuario.cobrador || '');
    }
  }, [usuario]);

  useEffect(() => {
    const fetchCobradores = async () => {
      try {
        setLoadingCobradores(true);
        const res = await fetch('/api/cobradores');
        if (!res.ok) throw new Error('Error al cargar cobradores');
        const data = await res.json();
        setCobradores(data);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoadingCobradores(false);
      }
    };
    fetchCobradores();
  }, []);

  const handleSave = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: usuario.id, sucursal, caja, cobrador }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Usuario: <span className="text-blue-600">{usuario.usuario}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {SUCURSALES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Caja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caja</label>
            <select
              value={caja}
              onChange={(e) => setCaja(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar --</option>
              {CAJAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cobrador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cobrador</label>
            <select
              value={cobrador}
              onChange={(e) => setCobrador(e.target.value)}
              disabled={loadingCobradores}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Seleccionar --</option>
              {cobradores.map((c) => (
                <option key={c.id || c.codigo} value={c.codigo}>
                  {c.cobrador}
                </option>
              ))}
            </select>
            {loadingCobradores && (
              <p className="mt-1 text-xs text-gray-500">Cargando cobradores...</p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
