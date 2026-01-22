'use client';

import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-gray-900">Sistema de Cobranza</h2>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <button className="hidden sm:flex relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.displayName || user?.email || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">{user?.email || '-'}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-2 sm:px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
