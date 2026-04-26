import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Award, Trophy, LogOut, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

const NAV = [
  { to: '/ambassador/home', icon: Home, label: 'Home' },
  { to: '/ambassador/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/ambassador/badges', icon: Award, label: 'Badges' },
  { to: '/ambassador/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function AmbassadorNav() {
  const { profile } = useAppStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const initials = profile?.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  const handleLogout = async () => { await signOut(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white hidden sm:block">CampusConnect</span>
        </div>

        <nav className="flex items-center gap-0.5 flex-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">{profile?.full_name}</span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
