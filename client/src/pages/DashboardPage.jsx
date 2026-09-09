import { useState, useEffect } from 'react';
import axios from 'axios';
import { useMetricsSocket, useServerStatusSocket } from '../hooks/useSocket';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const { metrics, connected: mc } = useMetricsSocket();
  const { servers, connected: sc, refresh } = useServerStatusSocket();

  useEffect(() => { axios.get('/api/dashboard').then(r => setData(r.data)).catch(console.error); }, []);

  return (
    <div className="flex flex-col gap-2xl">
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-2xl shadow-sm">
        <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-xs text-primary font-code-metric-sm text-code-metric-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Network Operations Center - Dashboard</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Dashboard Overview</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Ringkasan status seluruh infrastruktur jaringan yang dipantau secara real-time.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className={`w-2 h-2 rounded-full ${mc ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{mc ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard icon="dns" label="Total Server" value={data?.totalServer || 0} bg="bg-surface-container" iconColor="text-primary" />
        <StatCard icon="monitor_heart" label="Server Online" value={data?.totalOnline || 0} bg="bg-tertiary-container/20" iconColor="text-tertiary" valueColor="text-tertiary" />
        <StatCard icon="crisis_alert" label="Server Offline" value={data?.totalOffline || 0} bg="bg-error-container/40" iconColor="text-error" valueColor="text-error" />
        <StatCard icon="list_alt" label="Total Log" value={data?.totalLogs?.toLocaleString() || '0'} bg="bg-primary-container/20" iconColor="text-primary" />
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <MetricBar label="CPU Usage" value={metrics.cpu?.usage || 0} unit="%" color="bg-primary" sub={`${metrics.cpu?.cores} cores`} />
          <MetricBar label="Memory Usage" value={metrics.memory?.percentage || 0} unit="%" color="bg-tertiary" sub={`${metrics.memory?.used}/${metrics.memory?.total} MB`} />
          <MetricBar label="Disk Usage" value={metrics.disk?.percentage || 0} unit="%" color="bg-secondary" sub={`${metrics.disk?.used}/${metrics.disk?.total} GB`} />
        </div>
      )}

      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="px-xl py-md bg-surface-container-low flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface">Status Server</span>
          <button onClick={refresh} className="h-7 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md flex items-center gap-xs transition-colors shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-sm">sync</span>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">Server</th>
                <th className="py-md px-lg font-semibold">IP</th>
                <th className="py-md px-lg font-semibold text-center">Status</th>
                <th className="py-md px-lg font-semibold text-right">Latency</th>
                <th className="py-md px-xl font-semibold text-right">Terakhir Dicek</th>
              </tr>
            </thead>
            <tbody>
              {servers.length === 0 ? (
                <tr><td colSpan="5" className="py-3xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada data server</td></tr>
              ) : servers.map(s => (
                <tr key={s.id} className={`hover:bg-surface-container-low/60 transition-colors group cursor-default ${s.status === 'offline' ? 'bg-error-container/10' : ''}`}>
                  <td className="py-md px-xl">
                    <div className="flex items-center gap-md">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.status === 'online' ? 'bg-surface-container text-primary group-hover:bg-primary-fixed' : 'bg-error-container/40 text-error'} transition-colors`}>
                        <span className="material-symbols-outlined text-lg">{s.icon || 'dns'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-headline-sm ${s.status === 'online' ? 'text-on-surface' : 'text-error'}`}>{s.nama}</span>
                        <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{s.tipe || 'Server'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-md px-lg">
                    <div className="flex items-center gap-xs font-code-metric text-code-metric text-on-surface">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-tertiary' : 'bg-error'}`}></span>
                      {s.ip}
                    </div>
                  </td>
                  <td className="py-md px-lg text-center">
                    <span className={`inline-flex items-center gap-xs px-sm py-2xs rounded font-label-sm text-label-sm uppercase font-semibold ${s.status === 'online' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-error-container text-on-error-container'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-tertiary' : 'bg-error animate-ping'}`}></span>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-md px-lg text-right">
                    <span className={`font-code-metric text-code-metric font-semibold ${s.status === 'online' ? 'text-tertiary' : 'text-error'}`}>{s.latency ? `${s.latency} ms` : 'Timeout'}</span>
                  </td>
                  <td className="py-md px-xl text-right font-code-metric text-code-metric text-on-surface-variant">{s.checked_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, iconColor = 'text-on-surface-variant', valueColor = 'text-on-surface' }) {
  return (
    <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
        <span className={`font-headline-md text-headline-md font-code-metric mt-xs ${valueColor}`}>{value}</span>
      </div>
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${iconColor}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, unit, color, sub }) {
  return (
    <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between mb-sm">
        <span className="font-headline-sm text-headline-sm text-on-surface">{label}</span>
        <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{sub}</span>
      </div>
      <div className="text-headline-lg font-bold font-code-metric text-on-surface mb-sm">{value}{unit}</div>
      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
