import { Inbox, LibraryBig, LogOut, Plus, Ticket } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useTicketEvents } from '../hooks/useTicketEvents.js';

const AUTHOR_LINKS = [
  { to: '/books', label: 'My Books', icon: LibraryBig },
  { to: '/tickets', label: 'My Tickets', icon: Ticket, end: true },
  { to: '/tickets/new', label: 'Raise a query', icon: Plus },
];

const ADMIN_LINKS = [{ to: '/admin/tickets', label: 'Ticket queue', icon: Inbox }];

export default function Layout() {
  const { user, logout } = useAuth();
  const live = useTicketEvents();
  const isAdmin = user.role === 'admin';
  const links = isAdmin ? ADMIN_LINKS : AUTHOR_LINKS;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">B</span>
            <div className="leading-tight">
              <p className="font-semibold text-slate-900">BookLeaf</p>
              <p className="text-xs text-slate-500">{isAdmin ? 'Support Desk' : 'Author Portal'}</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-wrap gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span
              className={`flex items-center gap-1.5 text-xs ${live ? 'text-emerald-600' : 'text-slate-400'}`}
              title={live ? 'Updates appear automatically' : 'Reconnecting to live updates…'}
            >
              <span className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {live ? 'Live' : 'Offline'}
            </span>
            <span className="hidden text-slate-600 sm:inline">{user.name}</span>
            <button type="button" className="btn btn-ghost px-2" onClick={logout} title="Log out">
              <LogOut className="size-4" />
              <span className="sr-only">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
