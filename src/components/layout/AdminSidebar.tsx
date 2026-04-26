import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Users, Trophy, BarChart3, Settings, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/admin/ambassadors', icon: Users, label: 'Ambassadors' },
  { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const { profile, org } = useAppStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await signOut(); navigate('/login'); };
  const initials = profile?.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'A';

  const content = (
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">CampusConnect</p>
          <p className="text-xs text-gray-500 truncate">{org?.name ?? 'Admin Panel'}</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )
            }
          >
            <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500">Organization Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-9 h-9 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-screen w-60 z-50 transition-transform duration-300',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {content}
      </aside>
    </>
  );
}
