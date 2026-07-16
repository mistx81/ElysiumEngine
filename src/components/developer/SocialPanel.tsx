import type { Faction, GossipItem, NPCCore, Relationship } from '../../engine/types';

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

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function repColor(rep: number): string {
  if (rep >= 50) return COLORS.success;
  if (rep >= 0) return COLORS.warning;
  return COLORS.error;
}

export default function SocialPanel(props: any) {
  const gossipItems: GossipItem[] = props.gossip || [];
  const factions: Record<string, Faction> = props.factions || {};
  const npcs: NPCCore[] = props.npcs || [];
  const selectedNPC: NPCCore | undefined = props.selectedNPC;

  const factionList = Object.values(factions);

  const relationships: Relationship[] = selectedNPC
    ? Object.values(selectedNPC.relationships)
    : npcs.flatMap((n) => Object.values(n.relationships)).slice(0, 20);

  const npcName = (id: string): string => {
    const npc = npcs.find((n) => n.id === id);
    return npc ? npc.name : id;
  };

  const networkNodes = npcs.slice(0, 12);
  const nodePositions = networkNodes.map((_, i) => {
    const angle = (i / networkNodes.length) * Math.PI * 2;
    const radius = 40;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  });

  const networkLinks: Array<{ from: number; to: number }> = [];
  networkNodes.forEach((npc, i) => {
    const rels = Object.keys(npc.relationships);
    rels.forEach((targetId) => {
      const targetIdx = networkNodes.findIndex((n) => n.id === targetId);
      if (targetIdx !== -1 && targetIdx > i) {
        networkLinks.push({ from: i, to: targetIdx });
      }
    });
  });

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>SOCIAL SIMULATION</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
          {selectedNPC ? `${selectedNPC.name} — Social Profile` : 'Global Social Network'}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Gossip Feed</div>
        {gossipItems.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No gossip circulating</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>About</th>
                <th style={thStyle}>Topic</th>
                <th style={thStyle}>Spread</th>
                <th style={thStyle}>Truth</th>
              </tr>
            </thead>
            <tbody>
              {gossipItems.slice(0, 12).map((g, idx) => (
                <tr key={idx}>
                  <td style={{ ...tdStyle, color: COLORS.textDim }}>{formatTime(g.timestamp)}</td>
                  <td style={tdStyle}>{npcName(g.originatorId)}</td>
                  <td style={{ ...tdStyle, color: COLORS.warning }}>{npcName(g.aboutNPCId)}</td>
                  <td style={tdStyle}>{g.topic}</td>
                  <td style={{ ...tdStyle, color: COLORS.info }}>{g.spreadTo.length}</td>
                  <td style={{ ...tdStyle, color: g.truth > 0.5 ? COLORS.success : COLORS.error }}>
                    {(g.truth * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Factions</div>
        {factionList.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No factions formed</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Members</th>
                <th style={thStyle}>Reputation</th>
              </tr>
            </thead>
            <tbody>
              {factionList.map((f, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{f.name}</td>
                  <td style={{ ...tdStyle, color: COLORS.info }}>{f.memberIds.length}</td>
                  <td style={{ ...tdStyle, color: repColor(f.reputation), fontWeight: 700 }}>
                    {f.reputation.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Reputation Matrix</div>
        {relationships.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No relationship data</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>NPC</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Trust</th>
                <th style={thStyle}>Affinity</th>
                <th style={thStyle}>Familiarity</th>
              </tr>
            </thead>
            <tbody>
              {relationships.slice(0, 12).map((rel, idx) => (
                <tr key={idx}>
                  <td style={tdStyle}>{npcName(rel.npcId)}</td>
                  <td style={{ ...tdStyle, color: COLORS.accent }}>{rel.type}</td>
                  <td style={{ ...tdStyle, color: repColor(rel.trust) }}>{rel.trust.toFixed(1)}</td>
                  <td style={{ ...tdStyle, color: repColor(rel.affinity) }}>{rel.affinity.toFixed(1)}</td>
                  <td style={{ ...tdStyle, color: COLORS.textDim }}>{rel.familiarity.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Social Network</div>
        <div style={{ position: 'relative', width: '100%', height: 280, background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0 }}>
            {networkLinks.map((link, idx) => (
              <line
                key={idx}
                x1={nodePositions[link.from].x}
                y1={nodePositions[link.from].y}
                x2={nodePositions[link.to].x}
                y2={nodePositions[link.to].y}
                stroke={COLORS.border}
                strokeWidth={0.3}
              />
            ))}
            {networkNodes.map((npc, idx) => {
              const isSelected = selectedNPC && selectedNPC.id === npc.id;
              return (
                <g key={idx}>
                  <circle
                    cx={nodePositions[idx].x}
                    cy={nodePositions[idx].y}
                    r={isSelected ? 3 : 2}
                    fill={isSelected ? COLORS.accent : COLORS.info}
                  />
                  <text
                    x={nodePositions[idx].x}
                    y={nodePositions[idx].y - 3}
                    fontSize={2}
                    fill={COLORS.textDim}
                    textAnchor="middle"
                  >
                    {npc.name.slice(0, 6)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: COLORS.textDim, textAlign: 'center' }}>
          {networkNodes.length} nodes · {networkLinks.length} connections
        </div>
      </div>
    </div>
  );
}
