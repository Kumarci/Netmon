import { useState, useRef, useMemo } from 'react';

export default function LatencyChart({ data, height = 280 }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const validData = data.filter(d => d.latency_ms !== null && d.latency_ms !== undefined);
    if (validData.length === 0) return null;

    const latencies = validData.map(d => d.latency_ms);
    const maxVal = Math.max(...latencies, 10);
    const minVal = 0;
    const range = maxVal - minVal || 1;

    return { validData, latencies, maxVal, minVal, range };
  }, [data]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <span className="font-body-md text-body-md text-on-surface-variant">Belum ada data latency</span>
      </div>
    );
  }

  const { validData, maxVal, minVal, range } = chartData;
  const width = 800;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (i) => padding.left + (i / Math.max(validData.length - 1, 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

  const pathD = validData.map((d, i) => {
    const x = getX(i);
    const y = getY(d.latency_ms);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const gridLines = 5;
  const gridY = [];
  for (let i = 0; i <= gridLines; i++) {
    const val = minVal + (range * i) / gridLines;
    gridY.push({ val, y: getY(val) });
  }

  const timeLabels = [];
  const labelCount = Math.min(validData.length, 7);
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / (labelCount - 1)) * (validData.length - 1));
    const d = validData[idx];
    const date = new Date(d.checked_at);
    const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    timeLabels.push({ label, x: getX(idx) });
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;

    let closest = 0;
    let closestDist = Infinity;
    validData.forEach((_, i) => {
      const dist = Math.abs(getX(i) - svgX);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });

    const d = validData[closest];
    const date = new Date(d.checked_at);
    setTooltip({
      x: getX(closest),
      y: getY(d.latency_ms),
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
      latency: d.latency_ms,
      packetLoss: d.packet_loss || 0
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <clipPath id="chart-clip">
            <rect x={padding.left} y={padding.top} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={g.y} x2={padding.left + chartW} y2={g.y}
              stroke="#1e2940" strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={padding.left - 8} y={g.y + 4} textAnchor="end"
              className="fill-on-surface-variant" fontSize="10" fontFamily="JetBrains Mono">
              {Math.round(g.val)}
            </text>
          </g>
        ))}

        {timeLabels.map((t, i) => (
          <text key={i} x={t.x} y={height - 8} textAnchor="middle"
            className="fill-on-surface-variant" fontSize="10" fontFamily="JetBrains Mono">
            {t.label}
          </text>
        ))}

        <text x={8} y={padding.top + chartH / 2} textAnchor="middle" transform={`rotate(-90, 8, ${padding.top + chartH / 2})`}
          className="fill-on-surface-variant" fontSize="10" fontFamily="Inter">
          Latency (ms)
        </text>

        <path d={pathD} fill="none" stroke="#4d8af0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          clipPath="url(#chart-clip)" />

        <g clipPath="url(#chart-clip)">
          {validData.map((d, i) => (
            <circle key={i} cx={getX(i)} cy={getY(d.latency_ms)} r="3"
              fill="#0f1720" stroke="#4d8af0" strokeWidth="2"
              className="transition-all duration-200" />
          ))}
        </g>

        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={padding.top + chartH}
              stroke="#4d8af0" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#4d8af0" stroke="#0f1720" strokeWidth="2" />
            <rect x={tooltip.x + 8} y={tooltip.y - 48} width="130" height="44" rx="4"
              fill="#1e2940" stroke="#434d6b" strokeWidth="1" />
            <text x={tooltip.x + 16} y={tooltip.y - 32} fontSize="10" fontFamily="JetBrains Mono" fill="#e8ecf4">
              {tooltip.time}
            </text>
            <text x={tooltip.x + 16} y={tooltip.y - 18} fontSize="10" fontFamily="JetBrains Mono" fill="#4d8af0">
              Latency: {tooltip.latency} ms
            </text>
            <text x={tooltip.x + 16} y={tooltip.y - 4} fontSize="10" fontFamily="JetBrains Mono" fill="#ffb4ab">
              Packet Loss: {tooltip.packetLoss}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
