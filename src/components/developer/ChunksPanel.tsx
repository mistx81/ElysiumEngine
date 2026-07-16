import type { ChunkStats, LODLevel, NPCCore, SimulationChunk } from '../../engine/types';

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

const LOD_COLORS: Record<LODLevel, string> = {
  full: COLORS.success,
  reduced: COLORS.info,
  minimal: COLORS.warning,
  dormant: COLORS.textDim,
};

export default function ChunksPanel(props: any) {
  const stats: ChunkStats = props.chunkStats || {
    totalChunks: 0,
    activeChunks: 0,
    dormantChunks: 0,
    totalNPCs: 0,
    activeNPCs: 0,
    avgNPCsPerChunk: 0,
  };
  const npcs: NPCCore[] = props.npcs || [];
  const chunks: SimulationChunk[] = props.chunks || [];

  const activePct = stats.totalChunks > 0 ? (stats.activeChunks / stats.totalChunks) * 100 : 0;
  const dormantPct = stats.totalChunks > 0 ? (stats.dormantChunks / stats.totalChunks) * 100 : 0;
  const activeNpcPct = stats.totalNPCs > 0 ? (stats.activeNPCs / stats.totalNPCs) * 100 : 0;

  const npcPerChunk = chunks.map((c) => ({ coord: c.coord, count: c.npcIds.length, isActive: c.isActive, lod: c.lodLevel }));
  const maxNpcInChunk = Math.max(...npcPerChunk.map((c) => c.count), 1);

  const gridCols = Math.ceil(Math.sqrt(Math.max(chunks.length, 1)));
  const gridRows = Math.ceil(chunks.length / gridCols) || 1;

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>CHUNK SYSTEM</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Chunk Monitor</div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Chunk Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{stats.totalChunks}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Chunks</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{stats.activeChunks}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Active</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textDim }}>{stats.dormantChunks}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Dormant</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>NPC Distribution</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.info }}>{stats.totalNPCs}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total NPCs</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{stats.activeNPCs}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Active NPCs</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{stats.avgNPCsPerChunk.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Avg/Chunk</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Active vs Dormant</div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: COLORS.success }}>Active Chunks</span>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{activePct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${activePct}%`, height: '100%', background: COLORS.success, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>Dormant Chunks</span>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{dormantPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${dormantPct}%`, height: '100%', background: COLORS.textDim, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: COLORS.accent }}>Active NPCs</span>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{activeNpcPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${activeNpcPct}%`, height: '100%', background: COLORS.accent, borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Chunk Grid Visualization</div>
        {chunks.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8, textAlign: 'center' }}>No chunks loaded</div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: 4,
              padding: 8,
              background: COLORS.bg,
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
            }}>
              {Array.from({ length: gridCols * gridRows }, (_, idx) => {
                const chunk = chunks[idx];
                if (!chunk) {
                  return <div key={idx} style={{ aspectRatio: '1', background: 'transparent', borderRadius: 3 }} />;
                }
                const intensity = chunk.npcIds.length / maxNpcInChunk;
                const bg = chunk.isActive
                  ? LOD_COLORS[chunk.lodLevel]
                  : COLORS.border;
                return (
                  <div
                    key={idx}
                    style={{
                      aspectRatio: '1',
                      background: chunk.isActive ? bg : `${bg}33`,
                      borderRadius: 3,
                      border: `1px solid ${chunk.isActive ? bg : COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: chunk.isActive ? '#0a0e17' : COLORS.textDim,
                      opacity: chunk.isActive ? 0.4 + intensity * 0.6 : 0.4,
                      transition: 'all 0.3s',
                    }}
                    title={`(${chunk.coord.x},${chunk.coord.y}) — ${chunk.npcIds.length} NPCs — ${chunk.lodLevel}`}
                  >
                    {chunk.npcIds.length > 0 ? chunk.npcIds.length : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(Object.keys(LOD_COLORS) as LODLevel[]).map((level) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: LOD_COLORS[level] }} />
                  <span style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'capitalize' }}>{level}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.border, opacity: 0.4 }} />
                <span style={{ fontSize: 10, color: COLORS.textDim }}>dormant</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>NPCs per Chunk</div>
        {npcPerChunk.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No chunk data</div>
        ) : (
          npcPerChunk.slice(0, 12).map((c, idx) => {
            const pct = (c.count / maxNpcInChunk) * 100;
            return (
              <div key={idx} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: COLORS.text }}>
                    ({c.coord.x}, {c.coord.y})
                  </span>
                  <span style={{ fontSize: 11, color: c.isActive ? COLORS.success : COLORS.textDim }}>
                    {c.count} NPCs · {c.isActive ? 'active' : 'dormant'}
                  </span>
                </div>
                <div style={{ height: 6, background: COLORS.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: c.isActive ? LOD_COLORS[c.lod] : COLORS.textDim,
                    borderRadius: 3,
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
