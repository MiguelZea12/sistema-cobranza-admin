'use client';

import { DollarSign, Search, Filter, Calendar, User, CreditCard, Image as ImageIcon, X, MapPin, FileText, Hash, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Cobro } from '@/lib/types';

const ITEMS_PER_PAGE = 6;

export default function CobrosPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [filteredCobros, setFilteredCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<string>('');
  const [selectedFormaPago, setSelectedFormaPago] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal de imagen
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Listas únicas
  const [usuarios, setUsuarios] = useState<string[]>([]);

  useEffect(() => {
    fetchCobros();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cobros, searchTerm, selectedUsuario, selectedFormaPago, fechaInicio, fechaFin]);

  const fetchCobros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cobros');
      if (!response.ok) throw new Error('Error al cargar cobros');
      const data = await response.json();
      setCobros(data);
      
      // Extraer usuarios únicos
      const uniqueUsuarios: string[] = Array.from(
        new Set(
          data.map((c: Cobro) => c.createdBy).filter((u: any): u is string => typeof u === 'string')
        )
      );
      setUsuarios(uniqueUsuarios.sort());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cobros];

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clienteCedula.includes(searchTerm) ||
        c.numeroComprobante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por usuario
    if (selectedUsuario) {
      filtered = filtered.filter(c => c.createdBy === selectedUsuario);
    }

    // Filtro por forma de pago
    if (selectedFormaPago) {
      filtered = filtered.filter(c => c.formaPago === selectedFormaPago);
    }

    // Filtro por fecha inicio
    if (fechaInicio) {
      filtered = filtered.filter(c => new Date(c.fecha) >= new Date(fechaInicio));
    }

    // Filtro por fecha fin
    if (fechaFin) {
      filtered = filtered.filter(c => new Date(c.fecha) <= new Date(fechaFin));
    }

    setFilteredCobros(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUsuario('');
    setSelectedFormaPago('');
    setFechaInicio('');
    setFechaFin('');
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO'
    }).format(amount);
  };

  const getFormaPagoLabel = (formaPago: string) => {
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      cheque: 'Cheque',
      tarjeta: 'Tarjeta'
    };
    return labels[formaPago] || formaPago;
  };

  const getFormaPagoColor = (formaPago: string) => {
    const colors: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-700 border-green-200',
      transferencia: 'bg-blue-100 text-blue-700 border-blue-200',
      cheque: 'bg-purple-100 text-purple-700 border-purple-200',
      tarjeta: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[formaPago] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Estadísticas
  const totalCobros = filteredCobros.length;
  const totalMonto = filteredCobros.reduce((sum, c) => sum + c.monto, 0);
  const totalEfectivo = filteredCobros.filter(c => c.formaPago === 'efectivo').reduce((sum, c) => sum + c.monto, 0);
  const totalTransferencias = filteredCobros.filter(c => c.formaPago === 'transferencia').reduce((sum, c) => sum + c.monto, 0);

  // Paginación
  const totalPages = Math.ceil(filteredCobros.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCobros = filteredCobros.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobros</h1>
          <p className="mt-1 text-sm text-gray-600">
            Historial completo de cobros realizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Cobros</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCobros}</p>
            </div>
            <Receipt className="h-8 sm:h-10 w-8 sm:w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Cobrado</p>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(totalMonto)}</p>
            </div>
            <DollarSign className="h-8 sm:h-10 w-8 sm:w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Efectivo</p>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-green-600 truncate">{formatCurrency(totalEfectivo)}</p>
            </div>
            <DollarSign className="h-8 sm:h-10 w-8 sm:w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transferencias</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalTransferencias)}</p>
            </div>
            <CreditCard className="h-10 w-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* Búsqueda */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente, cédula..."
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

          {/* Forma de Pago */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <select
              value={selectedFormaPago}
              onChange={(e) => setSelectedFormaPago(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white truncate"
            >
              <option value="">Todas las formas de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>

          {/* Fecha Inicio */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fecha Fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      ) : filteredCobros.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No se encontraron cobros</p>
          <p className="text-gray-500 text-sm mt-2">Prueba ajustando los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCobros.map((cobro) => (
              <div
                key={cobro.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header de la card */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-white" />
                      <h3 className="font-semibold text-white">{cobro.clienteNombre}</h3>
                    </div>
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-green-100" />
                    <p className="text-sm text-green-100">{cobro.clienteCedula}</p>
                  </div>
                </div>

                {/* Imagen del cobro */}
                {cobro.imageUrl && (
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={cobro.imageUrl}
                      alt="Comprobante"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(cobro.imageUrl || null)}
                    />
                    <button
                      onClick={() => setSelectedImage(cobro.imageUrl || null)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-opacity"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Contenido */}
                <div className="p-6 space-y-4">
                  {/* Monto */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Monto:</span>
                    <span className="font-bold text-2xl text-green-600">{formatCurrency(cobro.monto)}</span>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium text-gray-900">{formatDate(cobro.fecha)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Forma de Pago:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getFormaPagoColor(cobro.formaPago)}`}>
                        {getFormaPagoLabel(cobro.formaPago)}
                      </span>
                    </div>

                    {cobro.numeroComprobante && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Comprobante:</span>
                        <span className="font-medium text-gray-900">{cobro.numeroComprobante}</span>
                      </div>
                    )}

                    {cobro.numeroLetra && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Letra:</span>
                        <span className="font-medium text-gray-900">#{cobro.numeroLetra}</span>
                      </div>
                    )}

                    {cobro.contratoId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Contrato:</span>
                        <span className="font-medium text-gray-900">
                          {cobro.contratoReferencia || cobro.contratoId.slice(-4)}
                        </span>
                      </div>
                    )}

                    {cobro.createdBy && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cobrador:</span>
                        <span className="font-medium text-gray-900">{cobro.createdBy}</span>
                      </div>
                    )}

                    {(cobro.latitude && cobro.longitude) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">
                          {cobro.latitude.toFixed(4)}, {cobro.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Saldos */}
                  <div className="pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Saldo Anterior:</span>
                      <span className="font-medium text-red-600">{formatCurrency(cobro.saldoAnterior)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Saldo Nuevo:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(cobro.saldoNuevo)}</span>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {cobro.observaciones && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic">"{cobro.observaciones}"</p>
                    </div>
                  )}

                  {/* Letras pagadas */}
                  {cobro.letrasPagadas && cobro.letrasPagadas.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Letras Pagadas:</p>
                      <div className="flex flex-wrap gap-2">
                        {cobro.letrasPagadas.map((letra, idx) => (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                            <span className="text-xs text-blue-700">
                              #{letra.numero}: {formatCurrency(letra.monto)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCobros.length)} de {filteredCobros.length}
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
                <div className="sm:hidden px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium min-w-[50px] text-center">
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
                            ? 'bg-green-600 text-white shadow-sm'
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

      {/* Modal de Imagen */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedImage}
              alt="Comprobante ampliado"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
