import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="ml-64 flex-1 p-xl">
        <Outlet />
      </main>
    </div>
  );
}
