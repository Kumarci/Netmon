import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLatencySocket } from '../hooks/useSocket';
import LatencyChart from '../components/LatencyChart';

const TIMEFRAMES = ['1H', '6H', '24H', '7D', '30D'];

function getLatencyStatus(avg, jitter) {
  if (avg === null || avg === undefined) return { label: 'Offline', color: 'text-error', bg: 'bg-error-container/40', icon: 'cloud_off' };
  if (avg < 30 && (!jitter || jitter < 5)) return { label: 'Healthy', color: 'text-tertiary', bg: 'bg-tertiary-container/20', icon: 'check_circle' };
  if (avg < 80 || (jitter && jitter < 15)) return { label: 'Warning', color: 'text-secondary', bg: 'bg-secondary-container/40', icon: 'warning' };
  return { label: 'Critical', color: 'text-error', bg: 'bg-error-container/40', icon: 'crisis_alert' };
}

export default function LatencyPage() {
  const { latencyData, connected, refresh } = useLatencySocket();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [compare, setCompare] = useState([]);
  const [timeframe, setTimeframe] = useState('24H');
  const [selectedServer, setSelectedServer] = useState('');

  useEffect(() => { fetchHistory(); fetchStats(); fetchCompare(); }, [timeframe, selectedServer]);

  const fetchHistory = async () => {
    try {
      const params = { timeframe };
      if (selectedServer) params.server_id = selectedServer;
      const r = await axios.get('/api/latency/history', { params });
      setHistory(r.data);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const params = { timeframe };
      if (selectedServer) params.server_id = selectedServer;
      const r = await axios.get('/api/latency/stats', { params });
      setStats(r.data);
    } catch {}
  };

  const fetchCompare = async () => {
    try {
      const r = await axios.get('/api/latency/compare');
      setCompare(r.data);
    } catch {}
  };

  const currentLatency = latencyData.length > 0 ? latencyData.reduce((a, b) => (a.latency || 0) + (b.latency || 0), 0) / latencyData.filter(d => d.latency !== null).length : null;
  const overallStatus = getLatencyStatus(currentLatency, stats?.avgJitter);

  return (
    <div className="flex flex-col gap-2xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-2xl shadow-sm">
        <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute right-48 -bottom-20 w-64 h-64 rounded-full bg-tertiary/5 blur-2xl pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-xl">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-xs text-primary font-code-metric-sm text-code-metric-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Telemetry Real-Time Latency Engine</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Network Latency</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Pemantauan latency jaringan secara real-time dengan analitik jitter, packet loss, dan stabilitas koneksi.
            </p>
          </div>
          <div className="flex items-center gap-md self-start md:self-auto">
            <div className="flex items-center gap-md">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{connected ? 'Live' : 'Disconnected'}</span>
            </div>
            <button onClick={refresh} className="flex items-center gap-xs h-8 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-lg">sync</span>
              Check Now
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-md">
        <StatCard label="Current" value={currentLatency !== null ? `${Math.round(currentLatency)}` : '--'} unit="ms" icon="speed" color="text-primary" bg="bg-primary-container/20" />
        <StatCard label="Average" value={stats?.avgLatency || '--'} unit="ms" icon="analytics" color="text-tertiary" bg="bg-tertiary-container/20" />
        <StatCard label="Minimum" value={stats?.minLatency || '--'} unit="ms" icon="trending_down" color="text-tertiary" bg="bg-tertiary-container/20" />
        <StatCard label="Maximum" value={stats?.maxLatency || '--'} unit="ms" icon="trending_up" color="text-secondary" bg="bg-secondary-container/40" />
        <StatCard label="Packet Loss" value={stats?.avgPacketLoss || '0'} unit="%" icon="wifi_off" color="text-error" bg="bg-error-container/40" />
        <StatCard label="Response Time" value={currentLatency !== null ? `${Math.round(currentLatency)}` : '--'} unit="ms" icon="timer" color="text-primary" bg="bg-primary-container/20" />
      </div>

      {/* Latency Status */}
      <div className="flex items-center gap-md">
        <div className={`flex items-center gap-xs px-md py-sm rounded-lg ${overallStatus.bg}`}>
          <span className={`material-symbols-outlined text-lg ${overallStatus.color}`}>{overallStatus.icon}</span>
          <span className={`font-label-md text-label-md font-semibold ${overallStatus.color}`}>{overallStatus.label}</span>
        </div>
        <span className="font-body-md text-body-md text-on-surface-variant">
          {overallStatus.label === 'Healthy' && 'Latency berada pada kondisi normal'}
          {overallStatus.label === 'Warning' && 'Latency mulai meningkat'}
          {overallStatus.label === 'Critical' && 'Latency sangat tinggi atau koneksi tidak stabil'}
          {overallStatus.label === 'Offline' && 'Tidak ada data latency'}
        </span>
      </div>

      {/* Chart */}
      <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between mb-lg">
          <div className="flex items-center gap-md">
            <span className="font-headline-sm text-headline-sm text-on-surface">Latency Graph</span>
            <div className="relative">
              <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)}
                className="h-7 px-md pr-8 bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors appearance-none cursor-pointer text-sm">
                <option value="">Semua Server</option>
                {compare.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className={`h-7 px-md rounded font-label-sm text-label-sm transition-colors cursor-pointer ${tf === timeframe ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}>
                {tf}
              </button>
            ))}
          </div>
        </div>
        <LatencyChart data={history} height={300} />
      </div>

      {/* Network Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <SummaryCard label="Average Latency" value={stats?.avgLatency || 0} unit="ms" icon="speed" color="text-primary" bg="bg-primary-container/20" />
        <SummaryCard label="Jitter" value={stats?.avgJitter || 0} unit="ms" icon="graph_1" color="text-secondary" bg="bg-secondary-container/40" />
        <SummaryCard label="Packet Loss" value={stats?.avgPacketLoss || 0} unit="%" icon="wifi_off" color="text-error" bg="bg-error-container/40" />
        <SummaryCard label="Connection Stability" value={stats?.stability || 100} unit="%" icon="cell_tower" color="text-tertiary" bg="bg-tertiary-container/20" />
      </div>

      {/* Server Latency Comparison */}
      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="px-xl py-md bg-surface-container-low flex items-center gap-md">
          <span className="font-headline-sm text-headline-sm text-on-surface">Server Latency Comparison</span>
          <span className="px-sm py-2xs rounded-full bg-surface-container font-code-metric-sm text-code-metric-sm text-on-surface-variant">{compare.length} servers</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">Server</th>
                <th className="py-md px-lg font-semibold">IP Address</th>
                <th className="py-md px-lg font-semibold text-right">Latency</th>
                <th className="py-md px-lg font-semibold text-right">Jitter</th>
                <th className="py-md px-lg font-semibold text-right">Packet Loss</th>
                <th className="py-md px-lg font-semibold text-center">Status</th>
                <th className="py-md px-xl font-semibold text-right">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {compare.length === 0 ? (
                <tr><td colSpan="7" className="py-3xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada data</td></tr>
              ) : compare.map(s => {
                const status = getLatencyStatus(s.latency_ms, s.jitter_ms);
                return (
                  <tr key={s.id} className={`hover:bg-surface-container-low/60 transition-colors group cursor-default ${s.latency_status === 'critical' ? 'bg-error-container/10' : ''}`}>
                    <td className="py-md px-xl">
                      <div className="flex items-center gap-md">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-lg">{s.icon || 'dns'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface">{s.nama}</span>
                          <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{s.tipe || 'Server'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-md px-lg">
                      <div className="flex items-center gap-xs font-code-metric text-code-metric text-on-surface">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.latency_ms !== null ? 'bg-tertiary' : 'bg-error'}`}></span>
                        {s.ip_address}
                      </div>
                    </td>
                    <td className="py-md px-lg text-right font-code-metric text-code-metric font-semibold">
                      <span className={status.color}>{s.latency_ms !== null ? `${s.latency_ms} ms` : 'Timeout'}</span>
                    </td>
                    <td className="py-md px-lg text-right font-code-metric text-code-metric text-on-surface-variant">
                      {s.jitter_ms !== null ? `${s.jitter_ms} ms` : '--'}
                    </td>
                    <td className="py-md px-lg text-right font-code-metric text-code-metric text-on-surface-variant">
                      {s.packet_loss !== null ? `${s.packet_loss}%` : '--'}
                    </td>
                    <td className="py-md px-lg text-center">
                      <span className={`inline-flex items-center gap-xs px-sm py-2xs rounded font-label-sm text-label-sm uppercase font-semibold ${status.bg} ${status.color}`}>
                        <span className="material-symbols-outlined text-sm">{status.icon}</span>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-md px-xl text-right font-code-metric text-code-metric text-on-surface-variant">
                      {s.checked_at ? new Date(s.checked_at).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon, color, bg }) {
  return (
    <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
        <div className="flex items-baseline gap-xs mt-xs">
          <span className={`font-headline-md text-headline-md font-code-metric ${color}`}>{value}</span>
          <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{unit}</span>
        </div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, icon, color, bg }) {
  return (
    <div className="p-md rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex items-center gap-md mb-sm">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      </div>
      <div className="flex items-baseline gap-xs">
        <span className={`font-headline-lg text-headline-lg font-code-metric ${color}`}>{value}</span>
        <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{unit}</span>
      </div>
    </div>
  );
}
