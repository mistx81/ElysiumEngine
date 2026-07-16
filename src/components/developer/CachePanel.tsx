import type { CacheStats } from '../../engine/types';

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export default function CachePanel(props: any) {
  const stats: CacheStats = props.cacheStats || {
    totalEntries: 0,
    totalHits: 0,
    totalMisses: 0,
    totalEvictions: 0,
    hitRate: 0,
    estimatedMemoryBytes: 0,
    entriesByCategory: {},
  };

  const hitRate = stats.hitRate ?? 0;
  const hitRateColor = hitRate >= 80 ? COLORS.success : hitRate >= 50 ? COLORS.warning : COLORS.error;
  const totalRequests = stats.totalHits + stats.totalMisses;
  const hitMissRatio = stats.totalMisses > 0 ? (stats.totalHits / stats.totalMisses).toFixed(2) : '∞';

  const categories = Object.entries(stats.entriesByCategory || {});
  const maxCategoryCount = Math.max(...categories.map(([, c]) => c as number), 1);

  const circumference = 2 * Math.PI * 40;
  const hitArc = (hitRate / 100) * circumference;

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>CACHE MONITOR</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Performance Cache</div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'center' }}>
        <div style={headerStyle}>Hit Rate Gauge</div>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke={COLORS.bg} strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={hitRateColor}
              strokeWidth="8"
              strokeDasharray={`${hitArc} ${circumference}`}
              strokeDashoffset={circumference / 4}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.3s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: hitRateColor }}>{hitRate.toFixed(1)}%</div>
            <div style={{ fontSize: 9, color: COLORS.textDim }}>Hit Rate</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Cache Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{stats.totalEntries}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Entries</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{stats.totalHits}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Hits</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.error }}>{stats.totalMisses}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Misses</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{stats.totalEvictions}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Evictions</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Hit / Miss Ratio</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: hitRateColor }}>{hitMissRatio}</div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>
            {totalRequests} total requests
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${hitRate}%`, background: COLORS.success, transition: 'width 0.3s' }} />
          <div style={{ width: `${100 - hitRate}%`, background: COLORS.error, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10 }}>
          <span style={{ color: COLORS.success }}>Hits {stats.totalHits}</span>
          <span style={{ color: COLORS.error }}>Misses {stats.totalMisses}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Estimated Memory Usage</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.info }}>
            {formatBytes(stats.estimatedMemoryBytes || 0)}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Entries by Category</div>
        {categories.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No categories</div>
        ) : (
          categories.map(([cat, count]) => {
            const pct = ((count as number) / maxCategoryCount) * 100;
            return (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: COLORS.text }}>{cat}</span>
                  <span style={{ fontSize: 11, color: COLORS.textDim }}>{count}</span>
                </div>
                <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: COLORS.accent,
                    borderRadius: 4,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
