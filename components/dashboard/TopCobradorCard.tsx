'use client';

import { Trophy, Award, Medal, TrendingUp } from 'lucide-react';

interface TopCobradorCardProps {
  usuario: string;
  total: number;
  cantidad: number;
  rank: number;
}

export function TopCobradorCard({ usuario, total, cantidad, rank }: TopCobradorCardProps) {
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-600" />;
      case 2:
        return <Award className="w-6 h-6 text-gray-600" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getMedalColor(rank)} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            {getMedalIcon(rank)}
          </div>
          <div>
            <span className="font-bold text-sm block">{usuario}</span>
            <span className="text-xs opacity-60">Puesto #{rank}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs opacity-75">Total cobrado</span>
          <span className="font-bold text-lg">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs opacity-75">Cobros realizados</span>
          <span className="font-semibold">{cantidad}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-current/20">
          <span className="text-xs opacity-75">Promedio</span>
          <span className="font-semibold text-sm">${(total / cantidad).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
