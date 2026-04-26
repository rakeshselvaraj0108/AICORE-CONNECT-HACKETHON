import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-6 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
