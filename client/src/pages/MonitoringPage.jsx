import { useState } from 'react';
import { useServerStatusSocket } from '../hooks/useSocket';
import DiagnosticTerminal from '../components/DiagnosticTerminal';
import PingResult from '../components/PingResult';

export default function MonitoringPage() {
  const { servers, connected, refresh } = useServerStatusSocket();
  const [pingResult, setPingResult] = useState(null);

  return (
    <div className="flex flex-col gap-2xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-2xl shadow-sm">
        <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-xs text-primary font-code-metric-sm text-code-metric-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Telemetry Real-Time Engine</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Monitoring Live Server</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Pemantauan status semua server secara real-time.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-md">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button onClick={refresh} className="flex items-center gap-xs h-8 px-md bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md transition-colors shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-lg">sync</span>
              Check Now
            </button>
          </div>
        </div>
      </div>

      {/* Server Status Table */}
      <div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="px-xl py-md bg-surface-container-low flex items-center gap-md">
          <span className="material-symbols-outlined text-lg text-primary">dns</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">Server Connectivity</span>
          <span className="px-sm py-2xs rounded-full bg-surface-container font-code-metric-sm text-code-metric-sm text-on-surface-variant">{servers.length} servers</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                <th className="py-md px-xl font-semibold">Server & Node</th>
                <th className="py-md px-lg font-semibold">IP / Hostname</th>
                <th className="py-md px-lg font-semibold">MAC Address</th>
                <th className="py-md px-lg font-semibold text-center">Port</th>
                <th className="py-md px-lg font-semibold text-center">Status</th>
                <th className="py-md px-lg font-semibold text-right">Latensi</th>
                <th className="py-md px-xl font-semibold text-right">Terakhir Dicek</th>
              </tr>
            </thead>
            <tbody>
              {servers.length === 0 ? (
                <tr><td colSpan="7" className="py-3xl text-center text-on-surface-variant font-body-md text-body-md">{connected ? 'Menunggu data...' : 'Menghubungkan...'}</td></tr>
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
                  <td className="py-md px-lg font-code-metric text-code-metric-sm text-on-surface-variant">{s.mac || '-'}</td>
                  <td className="py-md px-lg text-center font-code-metric text-code-metric text-on-surface-variant">{s.port || '-'}</td>
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

      {/* Network Diagnostic Terminal */}
      <DiagnosticTerminal onResult={setPingResult} />

      {/* Ping Result */}
      {pingResult && <PingResult result={pingResult} />}
    </div>
  );
}
