import { JSX } from 'react';

export function Spinner({ className = '' }: { className?: string }): JSX.Element {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
