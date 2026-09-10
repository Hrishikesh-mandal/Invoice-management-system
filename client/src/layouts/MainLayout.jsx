import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/invoices', label: 'Invoices' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-10">
          <span className="font-heading text-xl font-bold text-navy">Invoice Manager</span>
          <nav className="flex gap-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `border-b-2 pb-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-teal text-teal'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-slate-600">
                {user.name} <span className="text-slate-400">· {user.role}</span>
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}