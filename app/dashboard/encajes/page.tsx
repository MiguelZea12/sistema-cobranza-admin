'use client';

import { Calculator, DollarSign, TrendingUp, TrendingDown, Search, Filter, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EncajeCaja } from '@/lib/types';
import EditarArqueoModal from '@/components/dashboard/EditarArqueoModal';

const ITEMS_PER_PAGE = 6;

export default function EncajesPage() {
  const [encajes, setEncajes] = useState<EncajeCaja[]>([]);
  const [filteredEncajes, setFilteredEncajes] = useState<EncajeCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Lista única de usuarios
  const [usuarios, setUsuarios] = useState<string[]>([]);

  // Estados para modal de edición
  const [editingEncaje, setEditingEncaje] = useState<EncajeCaja | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estado para confirmación de eliminación
  const [deletingEncaje, setDeletingEncaje] = useState<EncajeCaja | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchEncajes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [encajes, searchTerm, selectedUsuario, fechaInicio, fechaFin]);

  const fetchEncajes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/encajes');
      if (!response.ok) throw new Error('Error al cargar encajes');
      const data = await response.json();
      setEncajes(data);
      
      // Extraer usuarios únicos
      const uniqueUsuarios = Array.from(new Set(data.map((e: EncajeCaja) => e.usuarioNombre))) as string[];
      setUsuarios(uniqueUsuarios.sort());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...encajes];

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por usuario
    if (selectedUsuario) {
      filtered = filtered.filter(e => e.usuarioNombre === selectedUsuario);
    }

    // Filtro por fecha inicio (desde las 00:00:00)
    if (fechaInicio) {
      const [year, month, day] = fechaInicio.split('-').map(Number);
      const inicio = new Date(year, month - 1, day, 0, 0, 0, 0);
      filtered = filtered.filter(e => {
        const fechaEncaje = normalizarFecha(e.fecha);
        return fechaEncaje >= inicio;
      });
    }

    // Filtro por fecha fin (hasta las 23:59:59)
    if (fechaFin) {
      const [year, month, day] = fechaFin.split('-').map(Number);
      const fin = new Date(year, month - 1, day, 23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const fechaEncaje = normalizarFecha(e.fecha);
        return fechaEncaje <= fin;
      });
    }

    setFilteredEncajes(filtered);
    setCurrentPage(1);
  };

  const normalizarFecha = (date: any): Date => {
    if (!date) return new Date(0);
    if (date?.toDate && typeof date.toDate === 'function') {
      return date.toDate();
    } else if (date?._seconds) {
      return new Date(date._seconds * 1000);
    } else {
      return new Date(date);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUsuario('');
    setFechaInicio('');
    setFechaFin('');
  };

  const handleEditEncaje = (encaje: EncajeCaja) => {
    setEditingEncaje(encaje);
    setIsEditModalOpen(true);
  };

  const handleSaveEncaje = (encajeActualizado: EncajeCaja) => {
    // Actualizar en la lista local
    setEncajes(prevEncajes =>
      prevEncajes.map(e => (e.id === encajeActualizado.id ? encajeActualizado : e))
    );
    setIsEditModalOpen(false);
    setEditingEncaje(null);
  };

  const handleDeleteEncaje = async (encaje: EncajeCaja) => {
    setDeletingEncaje(encaje);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deletingEncaje) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/encajes/${deletingEncaje.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar arqueo');
      setEncajes(prev => prev.filter(e => e.id !== deletingEncaje.id));
      setDeletingEncaje(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    let d: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (date?._seconds) {
      d = new Date(date._seconds * 1000);
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO'
    }).format(amount);
  };

  // Estadísticas
  const totalEncajes = filteredEncajes.length;
  const totalSobrante = filteredEncajes.filter(e => e.diferencia > 0).reduce((sum, e) => sum + e.diferencia, 0);
  const totalFaltante = filteredEncajes.filter(e => e.diferencia < 0).reduce((sum, e) => sum + Math.abs(e.diferencia), 0);
  const totalCobrado = filteredEncajes.reduce((sum, e) => sum + e.totalCobrado, 0);

  // Paginación
  const totalPages = Math.ceil(filteredEncajes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEncajes = filteredEncajes.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Arqueos de Caja</h1>
          <p className="mt-1 text-sm text-gray-600">
            Historial completo de arqueos realizados por los usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Arqueos</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalEncajes}</p>
            </div>
            <Calculator className="h-8 sm:h-10 w-8 sm:w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Cobrado</p>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(totalCobrado)}</p>
            </div>
            <DollarSign className="h-8 sm:h-10 w-8 sm:w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Sobrante</p>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 truncate">{formatCurrency(totalSobrante)}</p>
            </div>
            <TrendingUp className="h-8 sm:h-10 w-8 sm:w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Faltante</p>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600 truncate">{formatCurrency(totalFaltante)}</p>
            </div>
            <TrendingDown className="h-8 sm:h-10 w-8 sm:w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-hidden">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Usuario */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white truncate"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(usuario => (
                <option key={usuario} value={usuario}>{usuario}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>

          {/* Fecha Inicio */}
          <div className="relative min-w-0">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full min-w-0 pl-10 pr-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ maxWidth: '100%' }}
            />
          </div>

          {/* Fecha Fin */}
          <div className="relative min-w-0">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full min-w-0 pl-10 pr-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ maxWidth: '100%' }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Grid de Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : filteredEncajes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No se encontraron encajes</p>
          <p className="text-gray-500 text-sm mt-2">Prueba ajustando los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentEncajes.map((encaje) => (
              <div
                key={encaje.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header de la card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-white" />
                      <h3 className="font-semibold text-white">{encaje.usuarioNombre}</h3>
                    </div>
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm text-blue-100 mt-1">{formatDate(encaje.fecha)}</p>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-4">
                  {/* Total Cobrado */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Total Cobrado:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(encaje.totalCobrado)}</span>
                  </div>

                  {/* Detalle efectivo y transferencia */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(encaje.efectivoCobrado)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transferencia:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(encaje.transferenciaCobrado)}</span>
                    </div>
                    {(encaje.chequeCobrado || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cheques:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(encaje.chequeCobrado || 0)}</span>
                      </div>
                    )}
                    {(encaje.tarjetaCobrado || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tarjeta:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(encaje.tarjetaCobrado || 0)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Declarado:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(encaje.totalDeclarado)}</span>
                    </div>
                    {/* Efectivo declarado con desglose */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Efectivo declarado:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(encaje.efectivo)}</span>
                    </div>
                    {encaje.desglose && (
                      <details className="bg-gray-50 rounded-md p-2">
                        <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                          Ver desglose de efectivo declarado
                        </summary>
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                          {(encaje.desglose.billetes.cien > 0 || encaje.desglose.billetes.cincuenta > 0 ||
                            encaje.desglose.billetes.veinte > 0 || encaje.desglose.billetes.diez > 0 ||
                            encaje.desglose.billetes.cinco > 0 || encaje.desglose.billetes.uno > 0) && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Billetes:</p>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                {encaje.desglose.billetes.cien > 0 && <div className="flex justify-between"><span className="text-gray-600">$100 × {encaje.desglose.billetes.cien}:</span><span className="font-medium">{formatCurrency(100 * encaje.desglose.billetes.cien)}</span></div>}
                                {encaje.desglose.billetes.cincuenta > 0 && <div className="flex justify-between"><span className="text-gray-600">$50 × {encaje.desglose.billetes.cincuenta}:</span><span className="font-medium">{formatCurrency(50 * encaje.desglose.billetes.cincuenta)}</span></div>}
                                {encaje.desglose.billetes.veinte > 0 && <div className="flex justify-between"><span className="text-gray-600">$20 × {encaje.desglose.billetes.veinte}:</span><span className="font-medium">{formatCurrency(20 * encaje.desglose.billetes.veinte)}</span></div>}
                                {encaje.desglose.billetes.diez > 0 && <div className="flex justify-between"><span className="text-gray-600">$10 × {encaje.desglose.billetes.diez}:</span><span className="font-medium">{formatCurrency(10 * encaje.desglose.billetes.diez)}</span></div>}
                                {encaje.desglose.billetes.cinco > 0 && <div className="flex justify-between"><span className="text-gray-600">$5 × {encaje.desglose.billetes.cinco}:</span><span className="font-medium">{formatCurrency(5 * encaje.desglose.billetes.cinco)}</span></div>}
                                {encaje.desglose.billetes.uno > 0 && <div className="flex justify-between"><span className="text-gray-600">$1 × {encaje.desglose.billetes.uno}:</span><span className="font-medium">{formatCurrency(1 * encaje.desglose.billetes.uno)}</span></div>}
                              </div>
                            </div>
                          )}
                          {(encaje.desglose.monedas.un_dolar > 0 || encaje.desglose.monedas.cincuenta_centavos > 0 ||
                            encaje.desglose.monedas.veinticinco_centavos > 0 || encaje.desglose.monedas.diez_centavos > 0 ||
                            encaje.desglose.monedas.cinco_centavos > 0 || encaje.desglose.monedas.un_centavo > 0) && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Monedas:</p>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                {encaje.desglose.monedas.un_dolar > 0 && <div className="flex justify-between"><span className="text-gray-600">$1.00 × {encaje.desglose.monedas.un_dolar}:</span><span className="font-medium">{formatCurrency(1.00 * encaje.desglose.monedas.un_dolar)}</span></div>}
                                {encaje.desglose.monedas.cincuenta_centavos > 0 && <div className="flex justify-between"><span className="text-gray-600">$0.50 × {encaje.desglose.monedas.cincuenta_centavos}:</span><span className="font-medium">{formatCurrency(0.50 * encaje.desglose.monedas.cincuenta_centavos)}</span></div>}
                                {encaje.desglose.monedas.veinticinco_centavos > 0 && <div className="flex justify-between"><span className="text-gray-600">$0.25 × {encaje.desglose.monedas.veinticinco_centavos}:</span><span className="font-medium">{formatCurrency(0.25 * encaje.desglose.monedas.veinticinco_centavos)}</span></div>}
                                {encaje.desglose.monedas.diez_centavos > 0 && <div className="flex justify-between"><span className="text-gray-600">$0.10 × {encaje.desglose.monedas.diez_centavos}:</span><span className="font-medium">{formatCurrency(0.10 * encaje.desglose.monedas.diez_centavos)}</span></div>}
                                {encaje.desglose.monedas.cinco_centavos > 0 && <div className="flex justify-between"><span className="text-gray-600">$0.05 × {encaje.desglose.monedas.cinco_centavos}:</span><span className="font-medium">{formatCurrency(0.05 * encaje.desglose.monedas.cinco_centavos)}</span></div>}
                                {encaje.desglose.monedas.un_centavo > 0 && <div className="flex justify-between"><span className="text-gray-600">$0.01 × {encaje.desglose.monedas.un_centavo}:</span><span className="font-medium">{formatCurrency(0.01 * encaje.desglose.monedas.un_centavo)}</span></div>}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                    {(encaje.totalCheques || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cheques declarados:</span>
                        <span className="font-medium text-blue-700">{formatCurrency(encaje.totalCheques || 0)}</span>
                      </div>
                    )}
                    {(encaje.tarjeta || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tarjeta declarada:</span>
                        <span className="font-medium text-blue-700">{formatCurrency(encaje.tarjeta || 0)}</span>
                      </div>
                    )}
                    {encaje.cheques && encaje.cheques.length > 0 && (
                      <details className="bg-blue-50 rounded-md p-2 mt-1">
                        <summary className="text-xs font-medium text-blue-700 cursor-pointer hover:text-blue-900">
                          Ver detalle de cheques ({encaje.cheques.length})
                        </summary>
                        <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
                          {encaje.cheques.map((cheque, idx) => (
                            <div key={idx} className="bg-white rounded p-2 text-xs border border-blue-100">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Banco:</span>
                                <span className="font-medium text-gray-800">{cheque.banco}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">N° Cheque:</span>
                                <span className="font-medium text-gray-800">{cheque.numeroCheque}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Valor:</span>
                                <span className="font-bold text-blue-700">{formatCurrency(cheque.valor)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Diferencia */}
                  <div className={`rounded-lg p-4 ${
                    encaje.diferencia > 0 
                      ? 'bg-green-50 border border-green-200' 
                      : encaje.diferencia < 0 
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {encaje.diferencia > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : encaje.diferencia < 0 ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-gray-600" />
                        )}
                        <span className={`font-semibold ${
                          encaje.diferencia > 0 
                            ? 'text-green-700' 
                            : encaje.diferencia < 0 
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}>
                          {encaje.diferencia > 0 ? 'Sobrante' : encaje.diferencia < 0 ? 'Faltante' : 'Exacto'}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        encaje.diferencia > 0 
                          ? 'text-green-600' 
                          : encaje.diferencia < 0 
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {formatCurrency(Math.abs(encaje.diferencia))}
                      </span>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {encaje.observaciones && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic">"{encaje.observaciones}"</p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="pt-3 border-t border-gray-200 flex items-center gap-2">
                    <button
                      onClick={() => handleEditEncaje(encaje)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteEncaje(encaje)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredEncajes.length)} de {filteredEncajes.length}
              </div>
              
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[70px] sm:min-w-[80px]"
                >
                  Anterior
                </button>
                
                {/* Indicador de página actual en móvil */}
                <div className="sm:hidden px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium min-w-[50px] text-center">
                  {currentPage}/{totalPages}
                </div>
                
                {/* Botones de página en desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[70px] sm:min-w-[80px]"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de edición */}
      {editingEncaje && (
        <EditarArqueoModal
          encaje={editingEncaje}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEncaje(null);
          }}
          onSave={handleSaveEncaje}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deletingEncaje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Eliminar Arqueo</h2>
                <p className="text-sm text-gray-500">{deletingEncaje.usuarioNombre}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              ¿Estás seguro de que deseas eliminar el arqueo de{' '}
              <strong>{deletingEncaje.usuarioNombre}</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeletingEncaje(null); setDeleteError(null); }}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Eliminando...</>
                ) : (
                  <><Trash2 className="h-4 w-4" />Eliminar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
