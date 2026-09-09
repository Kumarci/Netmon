import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6dddb0', '#4d8af0', '#bec6e0', '#ffb4ab'];

export default function LaporanPage() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get('/api/riwayat/stats').then(r => setStats(r.data)).catch(console.error);
    axios.get('/api/riwayat/logs?limit=200').then(r => setLogs(r.data.logs || [])).catch(console.error);
  }, []);

  const dist = stats?.latencyDistribution;
  const pieData = dist ? [
    { name: '< 5ms', value: dist.fast.count },
    { name: '5-20ms', value: dist.normal.count },
    { name: '20-100ms', value: dist.degraded.count },
    { name: 'Timeout', value: dist.timeout.count }
  ] : [];

  const statusCounts = logs.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(statusCounts).map(([name, count]) => ({ name: name.toUpperCase(), count }));

  return (
    <div className="flex flex-col gap-2xl">
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-2xl shadow-sm">
        <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-xl">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-xs text-primary font-code-metric-sm text-code-metric-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Analytics &amp; Reporting Engine</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Laporan Monitoring</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Ringkasan dan analitik monitoring server untuk periode waktu tertentu.</p>
          </div>
          <div className="flex items-center gap-md self-start md:self-auto">
            <div className="flex items-center gap-md px-md py-sm bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-sm">
              <div className="p-xs bg-primary-container/20 text-primary rounded">
                <span className="material-symbols-outlined text-lg">analytics</span>
              </div>
              <div className="flex flex-col">
                <span className="font-code-metric text-code-metric text-on-surface font-semibold">{stats?.totalLogs?.toLocaleString() || 0}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Total Data Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between mb-lg">
            <span className="font-headline-sm text-headline-sm text-on-surface">Distribusi Latensi</span>
            <span className="font-code-metric-sm text-code-metric-sm text-tertiary bg-tertiary-container/20 px-sm py-2xs rounded">Pie Chart</span>
          </div>
          <div className="h-64">
            {pieData.length > 0 && pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full font-body-md text-body-md text-on-surface-variant">Belum ada data distribusi</div>
            )}
          </div>
        </div>

        <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between mb-lg">
            <span className="font-headline-sm text-headline-sm text-on-surface">Status Check</span>
            <span className="font-code-metric-sm text-code-metric-sm text-primary bg-primary-container/20 px-sm py-2xs rounded">Bar Chart</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c3c6d7" />
                <XAxis dataKey="name" stroke="#434655" fontSize={12} />
                <YAxis stroke="#434655" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#004ac6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="p-md rounded-xl bg-surface-container-lowest shadow-sm text-center">
          <span className="font-headline-md text-headline-md font-code-metric text-on-surface">{stats?.totalLogs?.toLocaleString() || 0}</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Total Log</p>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest shadow-sm text-center">
          <span className="font-headline-md text-headline-md font-code-metric text-tertiary">{stats?.avgLatency || 0} ms</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Rata-rata Respon</p>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest shadow-sm text-center">
          <span className="font-headline-md text-headline-md font-code-metric text-error">{stats?.failCount24h || 0}</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Gagal (24J)</p>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest shadow-sm text-center">
          <span className="font-headline-md text-headline-md font-code-metric text-primary">{stats?.serverCount || 0}</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Server Aktif</p>
        </div>
      </div>
    </div>
  );
}
