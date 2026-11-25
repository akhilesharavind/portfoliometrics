import React, { useId } from 'react';

interface LineChartProps {
  data: { label: string | number; value: number; benchmark?: number }[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  seriesName?: string;
  benchmarkName?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 280,
  valuePrefix = '$',
  valueSuffix = '',
  seriesName,
  benchmarkName
}) => {
  const rawId = useId();
  const gradientId = `linechart-grad-${rawId.replace(/:/g, '')}`;

  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const benchmarkValues = data.filter(d => d.benchmark !== undefined).map(d => d.benchmark as number);
  const finiteValues = [...values, ...benchmarkValues].filter(Number.isFinite);

  const rawMin = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const rawMax = finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
  const span = rawMax - rawMin;
  const pad = (span > 0 ? span : Math.abs(rawMax) || 1) * 0.08;
  const min = rawMin >= 0 ? Math.max(0, rawMin - pad) : rawMin - pad;
  const max = rawMax + pad;
  const range = max - min || 1;

  const width = 800;
  const padding = { top: 20, right: 24, bottom: 36, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (idx: number) => padding.left + (idx / Math.max(1, data.length - 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - ((val - min) / range) * chartHeight;

  // Path for portfolio
  const portfolioPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const portfolioArea = `${padding.left},${getY(data[0].value)} ` +
    portfolioPoints +
    ` ${getX(data.length - 1)},${padding.top + chartHeight} ${padding.left},${padding.top + chartHeight}`;

  // Path for benchmark
  const hasBenchmark = data.some(d => d.benchmark !== undefined);
  const benchmarkPoints = hasBenchmark
    ? data.map((d, i) => `${getX(i)},${getY(d.benchmark ?? d.value)}`).join(' ')
    : '';

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * range);

  const formatTick = (val: number) => {
    const abs = Math.abs(val);
    const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(0)}k` : abs.toFixed(0);
    return `${val < 0 ? '-' : ''}${valuePrefix}${formatted}${valueSuffix}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label={`${seriesName || 'Portfolio'} performance chart`}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        style={{ minWidth: 480 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5f14" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ff5f14" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Hairline Grid lines */}
        {yTicks.map((val, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="currentColor"
              className="text-black/[0.06] dark:text-white/[0.06]"
              strokeDasharray="2 3"
            />
            <text
              x={padding.left - 10}
              y={getY(val) + 3}
              textAnchor="end"
              className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular"
            >
              {formatTick(val)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const step = Math.ceil(data.length / 8);
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular"
            >
              {d.label}
            </text>
          );
        })}

        {/* Soft area fill */}
        <polygon points={portfolioArea} fill={`url(#${gradientId})`} />

        {/* Benchmark line */}
        {hasBenchmark && (
          <polyline
            points={benchmarkPoints}
            fill="none"
            stroke="currentColor"
            className="text-black/30 dark:text-white/30"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Portfolio line */}
        <polyline
          points={portfolioPoints}
          fill="none"
          stroke="#ff5f14"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Endpoint marker */}
        <circle 
          cx={getX(data.length - 1)} 
          cy={getY(data[data.length - 1].value)} 
          r="4.5" 
          fill="#ff5f14" 
          stroke="currentColor"
          className="text-white dark:text-graphite-card"
          strokeWidth="1.5" 
        />
      </svg>

      {/* Quiet Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-[#ff5f14] inline-block"></span>
          <span>{seriesName || 'Strategy'}</span>
        </div>
        {hasBenchmark && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-black/40 dark:border-white/40 inline-block"></span>
            <span>{benchmarkName || 'Benchmark (S&P 500)'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface DonutChartProps {
  items: { label: string; value: number; color?: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ items, size = 160 }) => {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value || 0), 0) || 100;
  // Crox technical hardware/metrology palette: international orange, titanium silver, slate, industrial graphite
  const colors = [
    '#ff5f14', '#969696', '#282829', '#e3e7eb', '#505159',
    '#ff8a50', '#7a8b99', '#ffab7a', '#3d405b', '#1a1b1c'
  ];

  let cumulativeAngle = 0;
  const radius = 56;
  const strokeWidth = 16;
  const center = size / 2;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-black/[0.04] dark:text-white/[0.05]"
          strokeWidth={strokeWidth}
        />
        {items.map((item, idx) => {
          const sliceAngle = (Math.max(0, item.value || 0) / total) * 360;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(sliceAngle / 360) * circumference} ${circumference}`;
          const strokeDashoffset = -((cumulativeAngle / 360) * circumference);
          cumulativeAngle += sliceAngle;
          const color = item.color || colors[idx % colors.length];

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </svg>
    </div>
  );
};
