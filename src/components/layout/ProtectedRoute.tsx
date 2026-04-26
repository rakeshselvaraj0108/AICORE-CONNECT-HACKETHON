import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import type { UserRole } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Props {
  role: UserRole;
}

export default function ProtectedRoute({ role }: Props) {
  const { profile, authLoading } = useAppStore();
  
  if (authLoading) return <LoadingSpinner fullPage />;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) return <Navigate to={profile.role === 'admin' ? '/admin/dashboard' : '/ambassador/home'} replace />;
  
  return <Outlet />;
}
