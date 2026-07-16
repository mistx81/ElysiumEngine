import type { BatchWriteStats } from '../../engine/types';

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

const cardStyle: Record<string, any> = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

const headerStyle: Record<string, any> = {
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.text,
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const btnBase: Record<string, any> = {
  padding: '8px 16px',
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.card,
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
};

function formatTimeAgo(ms: number): string {
  if (ms <= 0) return 'never';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function BatchWritesPanel(props: any) {
  const stats: BatchWriteStats = props.batchStats || {
    totalWrites: 0,
    totalFlushes: 0,
    pendingWrites: 0,
    lastFlushMs: 0,
    avgFlushSize: 0,
    writesByTable: {},
  };
  const flushIntervalMs: number = props.flushIntervalMs ?? 0;
  const onFlush: (() => void) | undefined = props.onFlush || props.flushBatch;
  const now = Date.now();
  const lastFlushAgo = stats.lastFlushMs > 0 ? now - stats.lastFlushMs : 0;

  const tables = Object.entries(stats.writesByTable || {});
  const maxTableCount = Math.max(...tables.map(([, c]) => c as number), 1);

  const pendingColor = stats.pendingWrites > 100 ? COLORS.error : stats.pendingWrites > 50 ? COLORS.warning : COLORS.success;

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>BATCH WRITES</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Write Buffer Monitor</div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Write Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{stats.totalWrites}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Writes</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{stats.totalFlushes}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Flushes</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: pendingColor }}>{stats.pendingWrites}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Pending</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Flush Metrics</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>Average Flush Size</span>
          <span style={{ color: COLORS.info, fontWeight: 700 }}>{stats.avgFlushSize.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>Last Flush</span>
          <span style={{ color: COLORS.warning, fontWeight: 700 }}>{formatTimeAgo(lastFlushAgo)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>Flush Interval</span>
          <span style={{ color: COLORS.accent, fontWeight: 700 }}>
            {flushIntervalMs > 0 ? `${(flushIntervalMs / 1000).toFixed(1)}s` : '—'}
          </span>
        </div>
      </div>

      {onFlush && (
        <div style={cardStyle}>
          <div style={headerStyle}>Manual Flush</div>
          <button
            style={{ ...btnBase, borderColor: COLORS.accent, color: COLORS.accent, width: '100%' }}
            onClick={onFlush}
          >
            ⚡ Flush Now ({stats.pendingWrites} pending)
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={headerStyle}>Writes by Table</div>
        {tables.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No writes recorded</div>
        ) : (
          tables.map(([table, count]) => {
            const pct = ((count as number) / maxTableCount) * 100;
            return (
              <div key={table} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: COLORS.text }}>{table}</span>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>{count}</span>
                </div>
                <div style={{ height: 10, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: COLORS.info,
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Pending Buffer</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: pendingColor }}>{stats.pendingWrites}</div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>writes awaiting flush</div>
        </div>
        <div style={{ marginTop: 8, height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min((stats.pendingWrites / Math.max(stats.avgFlushSize, 1)) * 100, 100)}%`,
            height: '100%',
            background: pendingColor,
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </div>
  );
}
