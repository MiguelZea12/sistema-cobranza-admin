'use client';

import { Trash2, Plus, Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Cobrador } from '@/lib/types';

export default function CobradoresPage() {
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo] = useState('012');
  const [showModal, setShowModal] = useState(false);
  const [editingCobrador, setEditingCobrador] = useState<Cobrador | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    cobrador: '',
    estado: '1' as '1' | '0',
    periodo: '012'
  });

  useEffect(() => {
    fetchCobradores();
  }, []);

  const fetchCobradores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cobradores?periodo=${periodo}`);
      if (!response.ok) throw new Error('Error al cargar cobradores');
      const data = await response.json();
      setCobradores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cobrador?')) return;
    
    try {
      const response = await fetch(`/api/cobradores?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      fetchCobradores();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (cobrador: Cobrador) => {
    setEditingCobrador(cobrador);
    setFormData({
      codigo: cobrador.codigo,
      cobrador: cobrador.cobrador,
      estado: (cobrador.estado === 'A' || cobrador.estado === '1' || cobrador.estado === 1) ? '1' : '0',
      periodo: cobrador.periodo
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingCobrador(null);
    setFormData({
      codigo: '',
      cobrador: '',
      estado: '1',
      periodo: '012'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cobradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingCobrador?.id
        })
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      setShowModal(false);
      fetchCobradores();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cobradores</h1>
          <p className="mt-1 text-sm text-gray-600">
            Los cobradores se sincronizan automáticamente desde SQL Anywhere
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cobrador
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">Código</th>
                <th className="px-6 py-3 font-medium text-gray-900">Nombre</th>
                <th className="px-6 py-3 font-medium text-gray-900">Estado</th>
                <th className="px-6 py-3 font-medium text-gray-900">Periodo</th>
                <th className="px-6 py-3 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : cobradores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay cobradores registrados
                  </td>
                </tr>
              ) : (
                cobradores.map((cobrador) => (
                  <tr key={cobrador.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {cobrador.codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {cobrador.cobrador}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        (cobrador.estado === 'A' || cobrador.estado === '1' || cobrador.estado === 1)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(cobrador.estado === 'A' || cobrador.estado === '1' || cobrador.estado === 1) ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {cobrador.periodo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(cobrador)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => cobrador.id && handleDelete(cobrador.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={!cobrador.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">
              {editingCobrador ? 'Editar Cobrador' : 'Nuevo Cobrador'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.cobrador}
                  onChange={(e) => setFormData({ ...formData, cobrador: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as '1' | '0' })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periodo
                </label>
                <input
                  type="text"
                  value={formData.periodo}
                  onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
