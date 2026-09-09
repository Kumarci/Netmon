import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: 'grid_view', label: 'Dashboard', section: 'Operational' },
  { to: '/monitoring', icon: 'monitor_heart', label: 'Monitoring', section: 'Operational' },
  { to: '/riwayat', icon: 'schedule', label: 'Riwayat', section: 'Operational' },
  { to: '/latency', icon: 'speed', label: 'Network Latency', section: 'Operational' },
  { to: '/laporan', icon: 'description', label: 'Laporan', section: 'Operational' },
  { to: '/servers', icon: 'dns', label: 'Manage Server', section: 'Admin', adminOnly: true },
  { to: '/users', icon: 'manage_accounts', label: 'Manage User', section: 'Admin', adminOnly: true },
];

export default function Sidebar({ user, onLogout }) {
  const operationalItems = navItems.filter(i => i.section === 'Operational');
  const adminItems = navItems.filter(i => i.section === 'Admin');

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/80 backdrop-blur-xl z-50 flex flex-col justify-between p-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-2xl">
        <div className="flex items-center gap-md px-xs py-2xs">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-on-primary">radar</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">NetMon</span>
            <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">NOC Telemetry v3.4</span>
          </div>
        </div>

        <nav className="flex flex-col gap-xs">
          <span className="px-md py-xs font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Operational</span>
          {operationalItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-sm rounded-xl font-body-md text-body-md transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-headline-sm shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {adminItems.some(i => !i.adminOnly || user?.role === 'admin') && (
            <span className="px-md py-xs mt-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Admin</span>
          )}
          {adminItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-md px-md py-sm rounded-xl font-body-md text-body-md transition-all ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-headline-sm shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center justify-between px-md py-sm border-t border-outline-variant/30 pt-lg">
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold font-headline-sm">
            {user?.nama?.charAt(0) || 'A'}
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface">{user?.nama}</span>
            <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant capitalize">{user?.role}</span>
          </div>
        </div>
        <button onClick={onLogout} className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </aside>
  );
}
