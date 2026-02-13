import { JSX } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, options, error, className = '', id, ...props }: SelectProps): JSX.Element {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
