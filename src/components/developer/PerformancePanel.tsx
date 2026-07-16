import type { PerformanceStats } from '../../engine/types';

const COLORS: Record<string, string> = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  muted: '#64748b',
};

export default function PerformancePanel(props: any) {
  const stats: PerformanceStats = props.perfStats ?? {
    tickCount: 0,
    lastTickMs: 0,
    avgTickMs: 0,
    maxTickMs: 0,
    totalEvents: 0,
    activeNPCs: 0,
  };
  const isRunning: boolean = props.isRunning ?? false;
  const tickHistory: number[] = props.tickHistory ?? [];

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    statusBadge: { padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' },
    controls: { display: 'flex', gap: '8px' },
    btn: { border: 'none', borderRadius: '4px', padding: '6px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
    kpi: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px', textAlign: 'center' },
    kpiValue: { fontSize: '22px', fontWeight: 700 },
    kpiLabel: { fontSize: '9px', color: COLORS.muted, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' },
    kpiUnit: { fontSize: '10px', color: COLORS.muted, marginTop: '2px' },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    sparkline: { width: '100%', height: '50px' },
    statRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px' },
    statLabel: { color: COLORS.muted },
    statValue: { fontWeight: 700 },
  };

  const tickColor = stats.lastTickMs > 50 ? COLORS.error : stats.lastTickMs > 20 ? COLORS.warning : COLORS.success;

  const renderSparkline = () => {
    if (tickHistory.length < 2) return <div style={{ color: COLORS.muted, textAlign: 'center', padding: '16px', fontSize: '11px' }}>Collecting tick data...</div>;
    const w = 280, h = 50, pad = 4;
    const max = Math.max(...tickHistory, 1);
    const points = tickHistory.map((v, i) => {
      const x = pad + (i / Math.max(tickHistory.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg style={styles.sparkline} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={points} fill="none" stroke={COLORS.accent} strokeWidth="1.5" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={COLORS.border} strokeWidth="0.5" />
      </svg>
    );
  };

  const eventsPerTick = stats.tickCount > 0 ? (stats.totalEvents / stats.tickCount).toFixed(1) : '0.0';
  const memEstimateMB = ((stats.activeNPCs * 0.15 + stats.totalEvents * 0.0005)).toFixed(1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Performance</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            ...styles.statusBadge,
            background: isRunning ? COLORS.success : COLORS.muted,
            color: '#fff',
          }}>
            {isRunning ? '● RUNNING' : '○ STOPPED'}
          </span>
        </div>
      </div>

      <div style={styles.controls}>
        <button
          style={{ ...styles.btn, background: isRunning ? COLORS.border : COLORS.success, color: '#fff' }}
          onClick={() => props.startSim?.()}
          disabled={isRunning}
        >
          Start
        </button>
        <button
          style={{ ...styles.btn, background: isRunning ? COLORS.error : COLORS.border, color: '#fff' }}
          onClick={() => props.stopSim?.()}
          disabled={!isRunning}
        >
          Stop
        </button>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.accent }}>{stats.tickCount.toLocaleString()}</div>
          <div style={styles.kpiLabel}>Tick Count</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: tickColor }}>{stats.lastTickMs.toFixed(1)}</div>
          <div style={styles.kpiLabel}>Last Tick</div>
          <div style={styles.kpiUnit}>ms</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.info }}>{stats.avgTickMs.toFixed(1)}</div>
          <div style={styles.kpiLabel}>Avg Tick</div>
          <div style={styles.kpiUnit}>ms</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: stats.maxTickMs > 50 ? COLORS.error : COLORS.warning }}>{stats.maxTickMs.toFixed(1)}</div>
          <div style={styles.kpiLabel}>Max Tick</div>
          <div style={styles.kpiUnit}>ms</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.success }}>{stats.totalEvents.toLocaleString()}</div>
          <div style={styles.kpiLabel}>Total Events</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.warning }}>{stats.activeNPCs}</div>
          <div style={styles.kpiLabel}>Active NPCs</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Tick Time Sparkline</div>
        {renderSparkline()}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Throughput & Memory</div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Events per Tick</span>
          <span style={styles.statValue}>{eventsPerTick}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Events per Second (est.)</span>
          <span style={styles.statValue}>{stats.avgTickMs > 0 ? (1000 / stats.avgTickMs * parseFloat(eventsPerTick)).toFixed(0) : '0'}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Memory Usage (est.)</span>
          <span style={{ ...styles.statValue, color: parseFloat(memEstimateMB) > 100 ? COLORS.warning : COLORS.success }}>{memEstimateMB} MB</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>NPCs per Tick (avg)</span>
          <span style={styles.statValue}>{stats.tickCount > 0 ? (stats.activeNPCs).toFixed(0) : '0'}</span>
        </div>
      </div>
    </div>
  );
}
