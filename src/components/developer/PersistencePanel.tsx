import type { PersistenceStats } from '../../engine/types';

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

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimeAgo(ms: number): string {
  if (ms <= 0) return 'never';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function PersistencePanel(props: any) {
  const stats: PersistenceStats = props.persistStats || {
    totalCheckpoints: 0,
    totalNPCsPersisted: 0,
    totalEventsPersisted: 0,
    lastCheckpointMs: 0,
    avgCheckpointMs: 0,
    isRunning: false,
    dirtyNPCs: 0,
  };
  const onCheckpoint: (() => void) | undefined = props.onCheckpoint || props.checkpoint;
  const now = Date.now();
  const lastCheckpointAgo = stats.lastCheckpointMs > 0 ? now - stats.lastCheckpointMs : 0;
  const dirtyColor = stats.dirtyNPCs > 50 ? COLORS.error : stats.dirtyNPCs > 20 ? COLORS.warning : COLORS.success;

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>PERSISTENCE</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Checkpoint Monitor</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: stats.isRunning ? COLORS.success : COLORS.textDim,
            boxShadow: stats.isRunning ? `0 0 8px ${COLORS.success}` : 'none',
          }} />
          <span style={{ fontSize: 11, color: stats.isRunning ? COLORS.success : COLORS.textDim, fontWeight: 700 }}>
            {stats.isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Checkpoint Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{stats.totalCheckpoints}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Checkpoints</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.info }}>{stats.totalNPCsPersisted}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>NPCs Persisted</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{stats.totalEventsPersisted}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Events Persisted</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: dirtyColor }}>{stats.dirtyNPCs}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Dirty NPCs</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Timing</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>Last Checkpoint</span>
          <span style={{ color: COLORS.warning, fontWeight: 700 }}>{formatTimeAgo(lastCheckpointAgo)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>Avg Checkpoint Duration</span>
          <span style={{ color: COLORS.accent, fontWeight: 700 }}>{formatDuration(stats.avgCheckpointMs)}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Dirty NPCs</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: dirtyColor }}>{stats.dirtyNPCs}</div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>NPCs with unsaved changes</div>
        </div>
        <div style={{ marginTop: 8, height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min((stats.dirtyNPCs / 100) * 100, 100)}%`,
            height: '100%',
            background: dirtyColor,
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Running Status</div>
        <div style={{
          padding: 12, borderRadius: 6, background: COLORS.bg,
          border: `1px solid ${stats.isRunning ? COLORS.success : COLORS.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: stats.isRunning ? COLORS.success : COLORS.textDim,
            boxShadow: stats.isRunning ? `0 0 10px ${COLORS.success}` : 'none',
            animation: stats.isRunning ? 'pulse 1.5s infinite' : 'none',
          }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: stats.isRunning ? COLORS.success : COLORS.textDim }}>
              {stats.isRunning ? 'Auto-save Active' : 'Auto-save Inactive'}
            </div>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>
              {stats.isRunning ? 'Periodically saving NPC and event state' : 'No automatic persistence running'}
            </div>
          </div>
        </div>
      </div>

      {onCheckpoint && (
        <div style={cardStyle}>
          <div style={headerStyle}>Manual Checkpoint</div>
          <button
            style={{ ...btnBase, borderColor: COLORS.accent, color: COLORS.accent, width: '100%' }}
            onClick={onCheckpoint}
          >
            💾 Checkpoint Now ({stats.dirtyNPCs} dirty)
          </button>
        </div>
      )}
    </div>
  );
}
