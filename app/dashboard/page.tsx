'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { TopCobradorCard } from '@/components/dashboard/TopCobradorCard';
import { ActividadItem } from '@/components/dashboard/ActividadItem';
import { Users, UserCircle, DollarSign, AlertCircle, TrendingUp, Wallet, MapPin, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalCobrado: number;
  totalEfectivo: number;
  totalTransferencias: number;
  cantidadCobros: number;
  topCobradores: Array<{
    usuario: string;
    total: number;
    cantidad: number;
  }>;
  totalEncajes: number;
  encajesConProblemas: number;
}

interface Actividad {
  id: string;
  tipo: 'cobro' | 'encaje';
  usuario: string;
  monto: number;
  clienteNombre?: string;
  fecha: string;
  formaPago?: string;
  diferencia?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    usuarios: 0,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [usuariosRes, statsRes, actividadesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/dashboard/stats?periodo=30'),
        fetch('/api/dashboard/actividades?limit=15')
      ]);

      const usuarios = await usuariosRes.json();
      const dashStats = await statsRes.json();
      const acts = await actividadesRes.json();

      setStats({
        usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
      });

      setDashboardStats(dashStats);
      setActividades(acts);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen general del sistema de cobranza - Últimos 30 días
        </p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Cobrado"
          value={`$${dashboardStats?.totalCobrado.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          description={`${dashboardStats?.cantidadCobros || 0} cobros`}
        />
        <StatsCard
          title="Efectivo"
          value={`$${dashboardStats?.totalEfectivo.toFixed(2) || '0.00'}`}
          icon={Wallet}
          description="En efectivo"
        />
        <StatsCard
          title="Transferencias"
          value={`$${dashboardStats?.totalTransferencias.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          description="Por transferencia"
        />
        <StatsCard
          title="Arqueos"
          value={dashboardStats?.totalEncajes.toString() || '0'}
          icon={AlertCircle}
          description={`${dashboardStats?.encajesConProblemas || 0} con diferencias`}
        />
      </div>

      {/* Top Cobradores */}
      {dashboardStats && dashboardStats.topCobradores.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Top Cobradores del Mes</h2>
            <span className="text-xs sm:text-sm text-gray-500">Últimos 30 días</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{dashboardStats.topCobradores.map((cobrador, index) => (
              <TopCobradorCard
                key={cobrador.usuario}
                usuario={cobrador.usuario}
                total={cobrador.total}
                cantidad={cobrador.cantidad}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tarjeta de Tracking GPS - Nuevo */}
      <Link href="/dashboard/tracking" className="block">
        <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">Tracking GPS</h2>
              </div>
              <p className="text-blue-700 mb-4">
                Visualiza las rutas de tus cobradores en tiempo real y revisa su recorrido diario
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-800">
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  <span>Rutas en tiempo real</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Todo el día</span>
                </div>
              </div>
            </div>
            <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Actividad Reciente</h2>
            <button
              onClick={fetchAllData}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Actualizar
            </button>
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : actividades.length > 0 ? (
              actividades.map((actividad) => (
                <ActividadItem
                  key={actividad.id}
                  tipo={actividad.tipo}
                  usuario={actividad.usuario}
                  monto={actividad.monto}
                  clienteNombre={actividad.clienteNombre}
                  fecha={new Date(actividad.fecha)}
                  formaPago={actividad.formaPago}
                  diferencia={actividad.diferencia}
                />
              ))
            ) : (
              <p className="text-sm text-gray-600 text-center py-12">No hay actividad reciente</p>
            )}
          </div>
        </div>

        {/* Resumen de Formas de Pago */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Resumen de Cobros</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Efectivo</span>
                <Wallet className="w-5 h-5 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${dashboardStats?.totalEfectivo.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {dashboardStats?.totalEfectivo && dashboardStats?.totalCobrado 
                  ? ((dashboardStats.totalEfectivo / dashboardStats.totalCobrado) * 100).toFixed(1)
                  : '0'}% del total
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Transferencias</span>
                <TrendingUp className="w-5 h-5 text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${dashboardStats?.totalTransferencias.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {dashboardStats?.totalTransferencias && dashboardStats?.totalCobrado 
                  ? ((dashboardStats.totalTransferencias / dashboardStats.totalCobrado) * 100).toFixed(1)
                  : '0'}% del total
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Arqueos de Caja</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total realizados</span>
                  <span className="font-semibold text-gray-900">{dashboardStats?.totalEncajes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Con diferencias</span>
                  <span className={`font-semibold ${
                    (dashboardStats?.encajesConProblemas || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {dashboardStats?.encajesConProblemas || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Exactos</span>
                  <span className="font-semibold text-green-600">
                    {(dashboardStats?.totalEncajes || 0) - (dashboardStats?.encajesConProblemas || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cobradores activos</span>
                  <span className="font-semibold text-gray-900">{stats.usuarios}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
