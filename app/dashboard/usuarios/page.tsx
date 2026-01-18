'use client';

import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Usuario } from '@/lib/types';

const ITEMS_PER_PAGE = 10;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const response = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      fetchUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (date?: any) => {
    if (!date) return '-';
    
    let d: Date;
    
    // Manejar Firebase Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    } 
    // Manejar objeto con _seconds (Firestore Timestamp serializado)
    else if (date?._seconds) {
      d = new Date(date._seconds * 1000);
    }
    // Manejar string o número
    else {
      d = new Date(date);
    }
    
    // Validar que la fecha sea válida
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Paginación
  const totalPages = Math.ceil(usuarios.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsuarios = usuarios.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Los usuarios se sincronizan automáticamente desde SQL Anywhere
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{usuarios.length}</span> usuarios
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">Usuario</th>
                <th className="px-6 py-3 font-medium text-gray-900">Código</th>
                <th className="px-6 py-3 font-medium text-gray-900">Fecha Creación</th>
                <th className="px-6 py-3 font-medium text-gray-900">Última Actualización</th>
                <th className="px-6 py-3 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                currentUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {usuario.usuario}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {usuario.codigo}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(usuario.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(usuario.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => usuario.id && handleDelete(usuario.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        disabled={!usuario.id}
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && !error && usuarios.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, usuarios.length)} de {usuarios.length} usuarios
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
