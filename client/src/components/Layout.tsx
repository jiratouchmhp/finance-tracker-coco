import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JSX } from 'react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/sales', label: 'Sales', icon: '💰' },
  { to: '/stock', label: 'Stock', icon: '📦' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/products', label: 'Products', icon: '🥥', ownerOnly: true },
];

export function Layout(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-full bg-emerald-800 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-emerald-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🥥 Coco Tracker
          </h1>
          <p className="text-emerald-300 text-sm mt-1">Finance Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            if (item.ownerOnly && user?.role !== 'OWNER') return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-emerald-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/80 flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0 ring-2 ring-emerald-500/30">
              {user?.username?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{user?.username}</p>
              <p className="text-xs text-emerald-400 leading-tight">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-700/60 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5a1 1 0 1 1 0 2H3a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h5a1 1 0 1 1 0 2H3zm11.293 3.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L16.586 11H8a1 1 0 1 1 0-2h8.586l-2.293-2.293a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
