import React, { useState, useEffect, useMemo } from 'react';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const CHART_DEFS = [
  { key: 'npcGrowth', label: 'NPC Growth', color: COLORS.accent, type: 'line' },
  { key: 'decisionRate', label: 'Decision Rate', color: COLORS.info, type: 'line' },
  { key: 'emotionDistribution', label: 'Emotion Distribution', color: COLORS.warning, type: 'bar' },
  { key: 'goalCompletion', label: 'Goal Completion', color: COLORS.success, type: 'bar' },
  { key: 'memoryGrowth', label: 'Memory Growth', color: COLORS.accent, type: 'line' },
  { key: 'cpuUsage', label: 'CPU Usage', color: COLORS.error, type: 'line' },
  { key: 'ramUsage', label: 'RAM Usage', color: COLORS.info, type: 'line' },
  { key: 'tickDuration', label: 'Tick Duration', color: COLORS.warning, type: 'line' },
  { key: 'cacheHits', label: 'Cache Hits', color: COLORS.success, type: 'bar' },
  { key: 'dbWrites', label: 'DB Writes', color: COLORS.accent, type: 'bar' },
  { key: 'pluginUsage', label: 'Plugin Usage', color: COLORS.info, type: 'bar' },
  { key: 'apiCalls', label: 'API Calls', color: COLORS.warning, type: 'line' },
];

function LineChart({ data, color }: { data: number[]; color: string }) {
  const points = data.length ? data : [0, 0, 0, 0, 0];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const step = w / (points.length - 1 || 1);
  const coords = points.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0].toFixed(2)} ${c[1].toFixed(2)}`).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 70 }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
      {coords.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r="0.8" fill={color} />
      ))}
    </svg>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const points = data.length ? data : [0, 0, 0, 0];
  const max = Math.max(...points, 1);
  const barW = 100 / (points.length * 1.6);
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" style={{ width: '100%', height: 70 }}>
      {points.map((d, i) => {
        const h = (d / max) * 30;
        const x = i * (barW * 1.6) + 2;
        return <rect key={i} x={x} y={34 - h} width={barW} height={h} fill={color} rx={1} opacity={0.85} />;
      })}
    </svg>
  );
}

function ChartCard({ def, data }: { def: any; data: any }) {
  const series = useMemo(() => {
    if (!data) return [];
    const raw = data[def.key] || data[def.label] || [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [raw];
  }, [data, def.key]);

  const latest = series.length ? series[series.length - 1] : 0;
  const prev = series.length > 1 ? series[series.length - 2] : latest;
  const change = latest - prev;
  const changePct = prev !== 0 ? (change / prev) * 100 : 0;

  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {def.label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: change >= 0 ? COLORS.success : COLORS.error,
            padding: '1px 6px',
            borderRadius: 3,
            background: (change >= 0 ? COLORS.success : COLORS.error) + '22',
          }}
        >
          {change >= 0 ? '+' : ''}
          {changePct.toFixed(1)}%
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: def.color }}>
        {typeof latest === 'number' ? latest.toFixed(1) : latest}
      </div>
      {def.type === 'line' ? <LineChart data={series} color={def.color} /> : <BarChart data={series} color={def.color} />}
    </div>
  );
}

export default function AnalyticsSection(props: any) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (props.refreshAnalytics) props.refreshAnalytics();
    const data = props.analytics || props.analyticsData || {};
    setAnalytics(data);
  }, []);

  useEffect(() => {
    const data = props.analytics || props.analyticsData || {};
    setAnalytics(data);
  }, [props.analytics, props.analyticsData]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(analytics || {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle: Record<string, any> = {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: COLORS.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 2 }}>
            {['1h', '24h', '7d', '30d'].map((r) => (
              <button
                key={r}
                style={{
                  ...btnStyle,
                  padding: '4px 10px',
                  border: 'none',
                  background: timeRange === r ? COLORS.accent : 'transparent',
                  color: timeRange === r ? '#fff' : COLORS.textDim,
                  borderRadius: 4,
                }}
                onClick={() => setTimeRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button style={{ ...btnStyle, borderColor: COLORS.accent }} onClick={exportJSON}>
            Export JSON
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
        }}
      >
        {CHART_DEFS.map((def) => (
          <ChartCard key={def.key} def={def} data={analytics} />
        ))}
      </div>

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Data Points</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent }}>
              {analytics ? Object.values(analytics).reduce((s: number, v: any) => s + (Array.isArray(v) ? v.length : 0), 0) : 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Range</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.info }}>{timeRange}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Charts</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.success }}>{CHART_DEFS.length}</div>
          </div>
        </div>
        <button style={btnStyle} onClick={() => props.refreshAnalytics && props.refreshAnalytics()}>
          Refresh
        </button>
      </div>
    </div>
  );
}
