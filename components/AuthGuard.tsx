'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Rutas accesibles por rol
const CAJERO_ALLOWED = ['/dashboard/cobrar', '/dashboard/cobros'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userRaw = localStorage.getItem('user');

      if (!userRaw && pathname !== '/login') {
        router.push('/login');
        setLoading(false);
        return;
      }

      if (userRaw && pathname === '/login') {
        const user = JSON.parse(userRaw);
        router.push(user.rol === 'cajero' ? '/dashboard/cobrar' : '/dashboard');
        setLoading(false);
        return;
      }

      // Verificar acceso por rol si el usuario está autenticado
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.rol === 'cajero') {
          const allowed = CAJERO_ALLOWED.some(
            (route) => pathname === route || pathname.startsWith(route + '/')
          );
          if (!allowed) {
            router.replace('/dashboard/cobrar');
            setLoading(false);
            return;
          }
        }
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
