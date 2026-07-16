import type { LODLevel, LODStats, NPCCore } from '../../engine/types';

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

const tableStyle: Record<string, any> = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
};

const thStyle: Record<string, any> = {
  textAlign: 'left',
  padding: '6px 8px',
  color: COLORS.textDim,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: 11,
  textTransform: 'uppercase',
};

const tdStyle: Record<string, any> = {
  padding: '6px 8px',
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.text,
};

const LOD_COLORS: Record<LODLevel, string> = {
  full: COLORS.success,
  reduced: COLORS.info,
  minimal: COLORS.warning,
  dormant: COLORS.textDim,
};

const LOD_ORDER: LODLevel[] = ['full', 'reduced', 'minimal', 'dormant'];

export default function LODPanel(props: any) {
  const stats: LODStats = props.lodStats || {
    totalNPCs: 0,
    fullCount: 0,
    reducedCount: 0,
    minimalCount: 0,
    dormantCount: 0,
    totalChanges: 0,
  };
  const npcs: NPCCore[] = props.npcs || [];

  const counts: Record<LODLevel, number> = {
    full: stats.fullCount,
    reduced: stats.reducedCount,
    minimal: stats.minimalCount,
    dormant: stats.dormantCount,
  };

  const total = stats.totalNPCs || (counts.full + counts.reduced + counts.minimal + counts.dormant) || 1;

  const lodPcts = LOD_ORDER.map((level) => ({
    level,
    count: counts[level],
    pct: (counts[level] / total) * 100,
    color: LOD_COLORS[level],
  }));

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>LEVEL OF DETAIL</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>LOD Distribution Monitor</div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{stats.totalNPCs}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total NPCs</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{stats.totalChanges}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Changes</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Distribution (Stacked Bar)</div>
        <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
          {lodPcts.map((item) => (
            <div
              key={item.level}
              style={{
                width: `${item.pct}%`,
                background: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#0a0e17',
                transition: 'width 0.3s',
                minWidth: item.count > 0 ? 2 : 0,
              }}
              title={`${item.level}: ${item.count} (${item.pct.toFixed(1)}%)`}
            >
              {item.pct > 10 ? item.count : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {lodPcts.map((item) => (
            <div key={item.level} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'capitalize' }}>{item.level}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginTop: 2 }}>
                {item.pct.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Pie Breakdown</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 100 100">
            {(() => {
              let cumulative = 0;
              return LOD_ORDER.map((level) => {
                const count = counts[level];
                const pct = (count / total) * 100;
                const offset = cumulative;
                cumulative += pct;
                const startAngle = (offset / 100) * 360 - 90;
                const endAngle = (cumulative / 100) * 360 - 90;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 50 + 40 * Math.cos(startRad);
                const y1 = 50 + 40 * Math.sin(startRad);
                const x2 = 50 + 40 * Math.cos(endRad);
                const y2 = 50 + 40 * Math.sin(endRad);
                const largeArc = pct > 50 ? 1 : 0;
                const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return count === 0 ? null : (
                  <path key={level} d={path} fill={LOD_COLORS[level]} stroke={COLORS.bg} strokeWidth={0.5} />
                );
              });
            })()}
            <circle cx="50" cy="50" r="22" fill={COLORS.card} />
            <text x="50" y="48" fontSize="10" fill={COLORS.text} textAnchor="middle" fontWeight="700">
              {total}
            </text>
            <text x="50" y="56" fontSize="5" fill={COLORS.textDim} textAnchor="middle">
              NPCs
            </text>
          </svg>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>LOD Level per NPC</div>
        {npcs.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No NPCs loaded</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>NPC Name</th>
                <th style={thStyle}>LOD Level</th>
              </tr>
            </thead>
            <tbody>
              {npcs.slice(0, 20).map((npc) => (
                <tr key={npc.id}>
                  <td style={tdStyle}>{npc.name}</td>
                  <td style={{ ...tdStyle }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: `${LOD_COLORS[npc.lodLevel]}22`,
                      color: LOD_COLORS[npc.lodLevel],
                      border: `1px solid ${LOD_COLORS[npc.lodLevel]}55`,
                    }}>
                      {npc.lodLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {npcs.length > 20 && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: COLORS.textDim }}>
            Showing 20 of {npcs.length} NPCs
          </div>
        )}
      </div>
    </div>
  );
}
