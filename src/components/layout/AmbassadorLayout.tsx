import { Outlet } from 'react-router-dom';
import AmbassadorNav from './AmbassadorNav';

export default function AmbassadorLayout() {
  return (
    <div className="min-h-screen">
      <AmbassadorNav />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-8 py-8 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}
