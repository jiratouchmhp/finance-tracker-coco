import { JSX } from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps): JSX.Element {
  const bgClass = className.includes('bg-') ? '' : 'bg-white';
  return (
    <div className={`${bgClass} shadow-sm rounded-xl p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
