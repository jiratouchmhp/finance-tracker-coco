import { JSX } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, className = '' }: StatCardProps): JSX.Element {
  return (
    <div className={`bg-white shadow-sm rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center mt-1 gap-2">
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
      </div>
    </div>
  );
}
