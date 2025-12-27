'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, UserCircle, DollarSign, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    cobradores: 0,
    usuarios: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [cobradoresRes, usuariosRes] = await Promise.all([
        fetch('/api/cobradores?periodo=012'),
        fetch('/api/usuarios')
      ]);

      const cobradores = await cobradoresRes.json();
      const usuarios = await usuariosRes.json();

      setStats({
        cobradores: Array.isArray(cobradores) ? cobradores.length : 0,
        usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen general del sistema de cobranza
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clientes"
          value="0"
          icon={Users}
        />
        <StatsCard
          title="Total Cobradores"
          value={stats.cobradores.toString()}
          icon={DollarSign}
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.usuarios.toString()}
          icon={UserCircle}
        />
        <StatsCard
          title="Clientes en Mora"
          value="0"
          icon={AlertCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">No hay actividad reciente</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sincronización Automática</h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Servicio Backend Activo
              </p>
              <p className="text-xs text-blue-600">
                La sincronización de cobradores, usuarios y clientes se realiza automáticamente cada 5 minutos mediante el servicio backend.
              </p>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>✓ Cobradores: Automático</p>
              <p>✓ Usuarios: Automático</p>
              <p>✓ Clientes: Automático</p>
              <p>✓ Cobros: Automático</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
