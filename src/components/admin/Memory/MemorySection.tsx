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

const MEMORY_TYPES = ['working', 'short', 'long', 'semantic', 'procedural', 'flashbulb', 'trauma'];

const TYPE_COLORS: Record<string, string> = {
  working: COLORS.accent,
  short: COLORS.info,
  long: COLORS.success,
  semantic: COLORS.warning,
  procedural: COLORS.textDim,
  flashbulb: COLORS.error,
  trauma: '#a855f7',
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / (max || 1)) * 100);
  return (
    <div style={{ background: COLORS.bg, borderRadius: 3, height: 6, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
}

function MiniBarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  const barW = 100 / (data.length * 1.6);
  return (
    <svg viewBox="0 0 100 40" style={{ width: '100%', height: 60 }}>
      {data.map((d, i) => {
        const h = (d / max) * 32;
        const x = i * (barW * 1.6) + 2;
        return (
          <g key={i}>
            <rect x={x} y={38 - h} width={barW} height={h} fill={color} rx={1} />
            <text x={x + barW / 2} y={40} fill={COLORS.textDim} fontSize={3} textAnchor="middle">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function MemorySection(props: any) {
  const [npcs, setNpcs] = useState<string[]>([]);
  const [selectedNpc, setSelectedNpc] = useState('all');
  const [memories, setMemories] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const npcList = props.npcs || props.npcList || props.kpis?.npcs || [];
    const names = Array.isArray(npcList) ? npcList.map((n: any) => (typeof n === 'string' ? n : n.name || n.id)) : [];
    setNpcs(names);
    const mem = props.memories || props.memoryData || props.kpis?.memories || [];
    setMemories(Array.isArray(mem) ? mem : []);
  }, [props.npcs, props.npcList, props.memories, props.memoryData, props.kpis]);

  const filtered = useMemo(() => {
    return memories.filter((m) => {
      const matchesNpc = selectedNpc === 'all' || m.npc === selectedNpc || m.npcName === selectedNpc || m.entity === selectedNpc;
      const matchesType = typeFilter === 'all' || m.type === typeFilter || m.memoryType === typeFilter;
      const content = (m.content || m.text || m.description || '').toLowerCase();
      const matchesSearch = !search || content.includes(search.toLowerCase());
      return matchesNpc && matchesType && matchesSearch;
    });
  }, [memories, selectedNpc, typeFilter, search]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    MEMORY_TYPES.forEach((t) => (g[t] = []));
    filtered.forEach((m) => {
      const t = m.type || m.memoryType || 'working';
      if (!g[t]) g[t] = [];
      g[t].push(m);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = memories.length;
    const byType: Record<string, number> = {};
    MEMORY_TYPES.forEach((t) => (byType[t] = 0));
    memories.forEach((m) => {
      const t = m.type || m.memoryType || 'working';
      byType[t] = (byType[t] || 0) + 1;
    });
    const growthData = props.kpis?.memoryGrowth || props.memoryGrowth || [0, 0, 0, 0, 0, 0, 0];
    return { total, byType, growthData: Array.isArray(growthData) ? growthData : [] };
  }, [memories, props.kpis, props.memoryGrowth]);

  const deleteMemory = (m: any) => {
    setMemories((prev) => prev.filter((x) => x !== m));
    if (props.deleteMemory) props.deleteMemory(m.id || m);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memories-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    try {
      const parsed = JSON.parse(importText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      setMemories((prev) => [...prev, ...arr]);
      setImportText('');
      setShowImport(false);
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const inputStyle: Record<string, any> = {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '6px 10px',
    borderRadius: 4,
    fontSize: 13,
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Memory Browser</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btnStyle, borderColor: COLORS.accent }} onClick={exportJSON}>
            Export JSON
          </button>
          <button style={{ ...btnStyle, borderColor: COLORS.success, color: COLORS.success }} onClick={() => setShowImport((v) => !v)}>
            Import
          </button>
        </div>
      </div>

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total Memories</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent }}>{stats.total}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Type Distribution</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {MEMORY_TYPES.map((t) => (
              <span key={t} style={{ fontSize: 11, color: TYPE_COLORS[t], fontWeight: 600 }}>
                {t}: {stats.byType[t] || 0}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Growth</div>
          <MiniBarChart
            data={stats.growthData.length ? stats.growthData : [1, 2, 3, 5, 7, 10, 12]}
            labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
            color={COLORS.success}
          />
        </div>
      </div>

      {showImport && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            style={{ ...inputStyle, minHeight: 80, fontFamily: 'monospace', resize: 'vertical' }}
            placeholder='Paste JSON array of memories...'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button style={{ ...btnStyle, borderColor: COLORS.success, color: COLORS.success, alignSelf: 'flex-start' }} onClick={importJSON}>
            Import Memories
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select style={inputStyle} value={selectedNpc} onChange={(e) => setSelectedNpc(e.target.value)}>
          <option value="all">All NPCs</option>
          {npcs.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select style={inputStyle} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {MEMORY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          placeholder="Search memories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MEMORY_TYPES.map((type) => {
          const items = grouped[type] || [];
          if (items.length === 0) return null;
          return (
            <div key={type} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: `1px solid ${COLORS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: COLORS.bg,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: TYPE_COLORS[type],
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {type}
                </span>
                <span style={{ fontSize: 11, color: COLORS.textDim }}>({items.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 100px 80px 60px',
                      gap: 12,
                      padding: '10px 14px',
                      borderBottom: i < items.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                      alignItems: 'center',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.content || m.text || m.description || '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bar value={m.importance || m.weight || 0} max={1} color={TYPE_COLORS[type]} />
                      <span style={{ fontSize: 10, color: COLORS.textDim, minWidth: 28 }}>
                        {((m.importance || m.weight || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span style={{ color: COLORS.textDim, fontSize: 11 }}>
                      {m.timestamp ? new Date(m.timestamp).toLocaleString() : '—'}
                    </span>
                    <span style={{ color: COLORS.textDim, fontSize: 11 }}>Recalls: {m.recallCount || m.recalls || 0}</span>
                    <button
                      style={{
                        ...btnStyle,
                        padding: '2px 8px',
                        fontSize: 11,
                        borderColor: COLORS.error,
                        color: COLORS.error,
                      }}
                      onClick={() => deleteMemory(m)}
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: COLORS.textDim, fontSize: 13, background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
            No memories found.
          </div>
        )}
      </div>
    </div>
  );
}
