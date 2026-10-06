import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, iconColor = 'blue', trend, trendLabel, onClick, loading = false }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorMap[iconColor] || colorMap.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {(trend !== undefined || trendLabel) && (
        <div className="mt-2 flex items-center gap-1">
          {trend > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          ) : null}
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {trendLabel || (trend > 0 ? `+${trend}%` : `${trend}%`)}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
