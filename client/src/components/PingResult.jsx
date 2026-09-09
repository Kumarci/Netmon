import { useMemo, useState } from 'react';

function getStatus(avg) {
  if (avg === null || avg === undefined) return { label: 'Offline', color: 'text-error', bg: 'bg-error-container/40', icon: 'cloud_off' };
  if (avg < 30) return { label: 'Healthy', color: 'text-tertiary', bg: 'bg-tertiary-container/20', icon: 'check_circle' };
  if (avg < 80) return { label: 'Warning', color: 'text-secondary', bg: 'bg-secondary-container/40', icon: 'warning' };
  return { label: 'Critical', color: 'text-error', bg: 'bg-error-container/40', icon: 'crisis_alert' };
}

export default function PingResult({ result }) {
  if (!result || result.command !== 'ping') return null;

  const stats = result.stats || {};
  const pingData = result.pingData || [];
  const status = getStatus(stats.avg);

  return (
    <div className="flex flex-col gap-xl">
      {/* Result Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-md">
        <ResultCard label="Latency" value={stats.avg || 0} unit="ms" icon="speed" color="text-primary" bg="bg-primary-container/20" />
        <ResultCard label="Packet Loss" value={stats.packetLoss || 0} unit="%" icon="wifi_off" color="text-error" bg="bg-error-container/40" />
        <ResultCard label="Packets Sent" value={stats.packetsSent || 0} unit="" icon="upload" color="text-on-surface" bg="bg-surface-container" />
        <ResultCard label="Packets Received" value={stats.packetsReceived || 0} unit="" icon="download" color="text-tertiary" bg="bg-tertiary-container/20" />
        <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Status</span>
            <span className={`font-headline-md text-headline-md font-code-metric mt-xs ${status.color}`}>{status.label}</span>
          </div>
          <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center ${status.color}`}>
            <span className="material-symbols-outlined text-lg">{status.icon}</span>
          </div>
        </div>
      </div>

      {/* Ping Latency Graph */}
      {pingData.length > 0 && pingData.some(p => p !== null) && (
        <div className="p-xl rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between mb-lg">
            <span className="font-headline-sm text-headline-sm text-on-surface">Ping Latency</span>
            <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{pingData.filter(p => p !== null).length} packets</span>
          </div>
          <PingGraph data={pingData} />
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, unit, icon, color, bg }) {
  return (
    <div className="p-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
        <div className="flex items-baseline gap-xs mt-xs">
          <span className={`font-headline-md text-headline-md font-code-metric ${color}`}>{value}</span>
          {unit && <span className="font-code-metric-sm text-code-metric-sm text-on-surface-variant">{unit}</span>}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
    </div>
  );
}

function PingGraph({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = null;

  const validData = data.map((val, i) => ({ packet: i + 1, latency: val })).filter(d => d.latency !== null);
  if (validData.length === 0) return null;

  const width = 800;
  const height = 160;
  const padding = { top: 16, right: 16, bottom: 32, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...validData.map(d => d.latency), 10);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const getX = (i) => padding.left + (i / Math.max(validData.length - 1, 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

  const pathD = validData.map((d, i) => {
    const x = getX(i);
    const y = getY(d.latency);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const gridLines = 4;
  const gridY = [];
  for (let i = 0; i <= gridLines; i++) {
    const val = minVal + (range * i) / gridLines;
    gridY.push({ val, y: getY(val) });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 160 }}>
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1={padding.left} y1={g.y} x2={padding.left + chartW} y2={g.y}
            stroke="#1e2940" strokeWidth="1" strokeDasharray="4 4" />
          <text x={padding.left - 8} y={g.y + 4} textAnchor="end"
            fill="#8a90a5" fontSize="10" fontFamily="JetBrains Mono">
            {Math.round(g.val)}
          </text>
        </g>
      ))}

      {validData.map((d, i) => (
        <text key={i} x={getX(i)} y={height - 6} textAnchor="middle"
          fill="#8a90a5" fontSize="9" fontFamily="JetBrains Mono">
          P{d.packet}
        </text>
      ))}

      <text x={8} y={padding.top + chartH / 2} textAnchor="middle" transform={`rotate(-90, 8, ${padding.top + chartH / 2})`}
        fill="#8a90a5" fontSize="9" fontFamily="Inter">
        ms
      </text>

      <path d={pathD} fill="none" stroke="#4d8af0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {validData.map((d, i) => (
        <circle key={i} cx={getX(i)} cy={getY(d.latency)} r="4"
          fill="#0a0e14" stroke="#4d8af0" strokeWidth="2"
          className="transition-all duration-200" />
      ))}
    </svg>
  );
}
