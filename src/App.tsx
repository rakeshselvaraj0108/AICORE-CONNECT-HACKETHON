import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './hooks/useAuth';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TaskManagement from './pages/admin/TaskManagement';
import AmbassadorDirectory from './pages/admin/AmbassadorDirectory';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

// Ambassador pages
import AmbassadorHome from './pages/ambassador/AmbassadorHome';
import MyTasks from './pages/ambassador/MyTasks';
import BadgesPage from './pages/ambassador/BadgesPage';
import AmbassadorLeaderboard from './pages/ambassador/AmbassadorLeaderboard';

// Layouts & guards
import AdminLayout from './components/layout/AdminLayout';
import AmbassadorLayout from './components/layout/AmbassadorLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

export default function App() {
  const { loadPersistedSettings } = useAppStore();
  const { getSession } = useAuth();

  useEffect(() => {
    loadPersistedSettings();
    getSession();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1e1b4b',
            color: '#f9fafb',
            fontSize: '14px',
            border: '1px solid rgba(99,102,241,0.2)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tasks" element={<TaskManagement />} />
            <Route path="/admin/ambassadors" element={<AmbassadorDirectory />} />
            <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Ambassador routes */}
        <Route element={<ProtectedRoute role="ambassador" />}>
          <Route element={<AmbassadorLayout />}>
            <Route path="/ambassador/home" element={<AmbassadorHome />} />
            <Route path="/ambassador/tasks" element={<MyTasks />} />
            <Route path="/ambassador/badges" element={<BadgesPage />} />
            <Route path="/ambassador/leaderboard" element={<AmbassadorLeaderboard />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
