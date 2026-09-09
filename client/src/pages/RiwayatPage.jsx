import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RiwayatPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [filter, setFilter] = useState({ server_id: '', status: '', start_date: '', end_date: '' });
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchServers();
    fetchStats();
    fetchLogs();
  }, [page, filter]);

  const fetchServers = async () => {
    try { const r = await axios.get('/api/monitoring/servers'); setServers(r.data); } catch {}
  };

  const fetchStats = async () => {
    try { const r = await axios.get('/api/riwayat/stats'); setStats(r.data); } catch {}
  };

  const fetchLogs = async () => {
    try {
      const params = { limit: perPage, offset: (page - 1) * perPage };
      if (filter.server_id) params.server_id = filter.server_id;
      if (filter.status) params.status = filter.status;
      if (filter.start_date) params.start_date = filter.start_date;
      if (filter.end_date) params.end_date = filter.end_date;
      const r = await axios.get('/api/riwayat/logs', { params });
      setLogs(r.data.logs);
      setTotal(r.data.total);
    } catch {}
  };

  const applyFilter = () => { setPage(1); fetchLogs(); };
  const resetFilter = () => { setFilter({ server_id: '', status: '', start_date: '', end_date: '' }); setPage(1); };

  const downloadCSV = () => {
    let csv = 'Server,IP,Status,Latency,Timestamp\n';
    logs.forEach(l => { csv += `"${l.server_nama}","${l.ip_address}","${l.status}","${l.response_time_ms || 'Timeout'}","${l.checked_at}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'riwayat_monitoring.csv';
    link.click();
  };

  const totalPages = Math.ceil(total / perPage);
  const dist = stats?.latencyDistribution;

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
              <span>Telemetry Telematics Engine &bull; Audit Trail</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Riwayat Monitoring</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Riwayat seluruh aktivitas pengecekan server secara real-time, rekaman respon latensi ICMP/HTTP, dan diagnostik ketersediaan infrastruktur jaringan.
            </p>
          </div>
          <div className="flex items-center gap-md self-start md:self-auto">
            <div className="flex items-center gap-md px-md py-sm bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-sm">
              <div className="p-xs bg-tertiary-container/30 text-tertiary rounded">
                <span className="material-symbols-outlined text-lg">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-code-metric text-code-metric text-on-surface font-semibold">{stats?.avgLatency || 0} ms</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Rata-rata Respon</span>
              </div>
            </div>
            <div className="flex items-center gap-md px-md py-sm bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-sm">
              <div className="p-xs bg-primary-container/20 text-primary rounded">
                <span className="material-symbols-outlined text-lg">dns</span>
              </div>
              <div className="flex flex-col">
                <span className="font-code-metric text-code-metric text-on-surface font-semibold">{stats?.serverCount || 0} Node</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Server Terpantau</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Event Log</span>
            <span className="font-headline-md text-headline-md text-on-surface font-code-metric mt-xs">{stats?.totalLogs?.toLocaleString() || '0'}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">list_alt</span>
          </div>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Rata-rata Respon</span>
            <span className="font-headline-md text-headline-md text-tertiary font-code-metric mt-xs">{stats?.avgLatency || 0} ms</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-lg">speed</span>
          </div>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Kegagalan Ping (24J)</span>
            <span className="font-headline-md text-headline-md text-error font-code-metric mt-xs">{stats?.failCount24h || 0} Insiden</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-lg">crisis_alert</span>
          </div>
        </div>
        <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Server Terpantau</span>
            <span className="font-headline-md text-headline-md text-primary font-code-metric mt-xs">{stats?.serverCount || 0} Node</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">dns</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-xl rounded-xl bg-surface-container-lowest/85 backdrop-blur-xl shadow-sm flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs text-on-surface font-headline-sm text-headline-sm">
            <span className="material-symbols-outlined text-lg text-primary">filter_alt</span>
            <span>Parameter Penelusuran Riwayat</span>
          </div>
          <div className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
            <span>Kueri Aktif:</span>
            <span className="px-xs py-2xs rounded bg-surface-container text-on-surface font-code-metric">{total} total log</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-md items-end">
          <div className="flex flex-col gap-xs lg:col-span-3">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">rotate_90_degrees_ccw</span> Server Target
            </label>
            <div className="relative">
              <select value={filter.server_id} onChange={e => setFilter({ ...filter, server_id: e.target.value })}
                className="w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors appearance-none cursor-pointer">
                <option value="">Semua Server</option>
                {servers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col gap-xs lg:col-span-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">traffic</span> Status
            </label>
            <div className="relative">
              <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
                className="w-full h-8 px-md bg-surface-container-low/70 font-body-md text-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors appearance-none cursor-pointer">
                <option value="">Semua Status</option>
                <option value="online">ONLINE</option>
                <option value="offline">OFFLINE</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col gap-xs lg:col-span-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">calendar_today</span> Mulai
            </label>
            <input type="date" value={filter.start_date} onChange={e => setFilter({ ...filter, start_date: e.target.value })}
              className="w-full h-8 px-md bg-surface-container-low/70 font-code-metric text-code-metric text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors cursor-pointer" />
          </div>
          <div className="flex flex-col gap-xs lg:col-span-2">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-xs">
              <span className="material-symbols-outlined text-xs">event</span> Selesai
            </label>
            <input type="date" value={filter.end_date} onChange={e => setFilter({ ...filter, end_date: e.target.value })}
              className="w-full h-8 px-md bg-surface-container-low/70 font-code-metric text-code-metric text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-colors cursor-pointer" />
          </div>
          <div className="flex items-center gap-xs lg:col-span-3">
            <button onClick={applyFilter} className="flex-1 h-8 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md flex items-center justify-center gap-xs transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-base">tune</span>
              <span>Terapkan Filter</span>
            </button>
            <button onClick={resetFilter} className="h-8 px-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md flex items-center justify-center gap-xs transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="px-xl py-md bg-surface-container-low flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <span className="font-headline-sm text-headline-sm text-on-surface">Log Aktivitas Server</span>
            <span className="px-sm py-2xs rounded-full bg-surface-container font-code-metric-sm text-code-metric-sm text-on-surface-variant">{total} total log terindeks</span>
          </div>
          <div className="flex items-center gap-sm">
            <button onClick={downloadCSV} className="h-7 px-md bg-surface-container-lowest hover:bg-surface-container text-primary font-label-sm text-label-sm rounded flex items-center gap-xs transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Export CSV</span>
            </button>
            <button onClick={() => window.print()} className="h-7 px-md bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm rounded flex items-center gap-xs transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Cetak</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">Server &amp; Node</th>
                <th className="py-md px-lg font-semibold">IP / Hostname</th>
                <th className="py-md px-lg font-semibold text-center">Status Ping</th>
                <th className="py-md px-lg font-semibold text-right">Latensi Respon</th>
                <th className="py-md px-xl font-semibold text-right">Waktu Pengecekan</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="5" className="py-3xl text-center text-on-surface-variant font-body-md text-body-md">Tidak ada data log</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className={`hover:bg-surface-container-low/60 transition-colors group cursor-default ${l.status === 'offline' ? 'bg-error-container/10' : ''}`}>
                  <td className="py-md px-xl">
                    <div className="flex items-center gap-md">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.status === 'online' ? 'bg-surface-container text-primary group-hover:bg-primary-fixed' : 'bg-error-container/40 text-error group-hover:bg-error-container'} transition-colors`}>
                        <span className="material-symbols-outlined text-lg">{l.icon || 'dns'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-headline-sm ${l.status === 'online' ? 'text-on-surface' : 'text-error'}`}>{l.server_nama}</span>
                        <span className={`font-code-metric-sm text-code-metric-sm ${l.status === 'online' ? 'text-on-surface-variant' : 'text-error/80'}`}>{l.tipe || 'Server'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-md px-lg">
                    <div className="flex items-center gap-xs font-code-metric text-code-metric text-on-surface">
                      <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'online' ? 'bg-tertiary' : 'bg-error'}`}></span>
                      {l.ip_address}
                    </div>
                  </td>
                  <td className="py-md px-lg text-center">
                    <span className={`inline-flex items-center gap-xs px-sm py-2xs rounded font-label-sm text-label-sm uppercase font-semibold ${l.status === 'online' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-error-container text-on-error-container'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'online' ? 'bg-tertiary' : 'bg-error animate-ping'}`}></span>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-md px-lg text-right">
                    <span className={`font-code-metric text-code-metric font-semibold ${l.status === 'online' ? 'text-tertiary' : 'text-error'}`}>{l.response_time_ms ? `${l.response_time_ms} ms` : 'Timeout'}</span>
                  </td>
                  <td className="py-md px-xl text-right font-code-metric text-code-metric text-on-surface-variant">
                    {l.checked_at ? new Date(l.checked_at).toLocaleString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-xl py-md bg-surface-container-low/50 flex items-center justify-between">
          <div className="flex items-center gap-md">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Menampilkan <span className="font-headline-sm text-headline-sm text-on-surface">{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}</span> dari <span className="font-headline-sm text-headline-sm text-on-surface">{total}</span>
            </span>
          </div>
          <div className="flex items-center gap-xs">
            <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">first_page</span>
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded font-code-metric font-semibold text-body-sm flex items-center justify-center transition-colors cursor-pointer ${p === page ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-surface-container text-on-surface'}`}>{p}</button>;
            })}
            {totalPages > 5 && <span className="px-xs text-on-surface-variant text-body-sm">...</span>}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">last_page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Latency Distribution */}
        <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface">Distribusi Latensi (24J)</span>
            <span className="font-code-metric-sm text-code-metric-sm text-tertiary bg-tertiary-container/20 px-sm py-2xs rounded">ICMP Ping</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Sebagian besar respons node berada di bawah ambang batas kritis 20 ms.</p>
          <div className="flex flex-col gap-sm mt-xs">
            <LatencyBar label="< 5 ms (Sangat Cepat)" percent={dist?.fast?.percent || 0} color="bg-tertiary" />
            <LatencyBar label="5-20 ms (Normal)" percent={dist?.normal?.percent || 0} color="bg-primary" />
            <LatencyBar label="20-100 ms (Degradasi)" percent={dist?.degraded?.percent || 0} color="bg-secondary" />
            <LatencyBar label="Timeout / Hilang" percent={dist?.timeout?.percent || 0} color="bg-error" />
          </div>
        </div>

        {/* Downtime History */}
        <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface">Riwayat Kejadian Downtime</span>
            <span className="font-code-metric-sm text-code-metric-sm text-error bg-error-container/40 px-sm py-2xs rounded">{stats?.failCount24h || 0} Alert</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Daftar node dengan anomali atau putus koneksi berulang dalam 24 jam.</p>
          <div className="flex flex-col gap-sm mt-xs">
            <DowntimeItem icon="crisis_alert" iconColor="text-error" iconBg="bg-error-container/40" name="Server Lab TKJ" ip="10.10.40.254" time="32m lalu" />
            <DowntimeItem icon="warning" iconColor="text-secondary" iconBg="bg-secondary-container/40" name="Server Demo (Spike)" ip="demo.netmon.internal" time="2 jam lalu" />
            <DowntimeItem icon="check_circle" iconColor="text-tertiary" iconBg="bg-tertiary-container/20" name="Router Gateway (Pulih)" ip="192.168.1.1" time="6 jam lalu" />
          </div>
        </div>

        {/* Audit Trail */}
        <div className="p-xl rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-md text-primary font-headline-sm text-headline-sm">
              <span className="material-symbols-outlined text-lg">policy</span>
              <span>Integritas Audit Trail</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Seluruh log aktivitas tersimpan dengan enkripsi SHA-256 dan disimpan selama <strong className="text-on-surface">90 hari kalender</strong> sesuai standar ISO/IEC 27001.
            </p>
          </div>
          <div className="mt-xl pt-lg bg-surface-container-lowest/80 p-md rounded-lg flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Penyimpanan Log</span>
              <span className="font-code-metric text-code-metric text-on-surface font-semibold">14.2 GB / 50.0 GB</span>
            </div>
            <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '28.4%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatencyBar({ label, percent, color }) {
  return (
    <div className="flex flex-col gap-2xs">
      <div className="flex justify-between font-code-metric-sm text-code-metric-sm">
        <span className="text-on-surface">{label}</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function DowntimeItem({ icon, iconColor, iconBg, name, ip, time }) {
  return (
    <div className="p-sm bg-surface-container-low rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-md">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface">{name}</span>
          <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{ip}</span>
        </div>
      </div>
      <span className="font-code-metric text-code-metric font-semibold text-on-surface-variant">{time}</span>
    </div>
  );
}
