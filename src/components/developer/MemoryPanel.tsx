import { useState, useMemo } from 'react';
import type { NPCCore, MemoryType, MemoryRecord } from '../../engine/types';

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

const MEMORY_TYPES: MemoryType[] = ['working', 'short', 'long', 'semantic', 'procedural', 'flashbulb', 'trauma'];

const TYPE_COLORS: Record<MemoryType, string> = {
  working: COLORS.accent,
  short: COLORS.info,
  long: COLORS.success,
  semantic: COLORS.warning,
  procedural: '#8b5cf6',
  flashbulb: COLORS.error,
  trauma: '#dc2626',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MemoryPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const [filter, setFilter] = useState<MemoryType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    controls: { display: 'flex', gap: '8px', alignItems: 'center' },
    input: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', width: '160px' },
    select: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px' },
    typeBar: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
    typeBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: '1px solid transparent' },
    list: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    typeTag: { fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px' },
    content: { fontSize: '12px', marginBottom: '8px' },
    meta: { display: 'flex', gap: '16px', fontSize: '10px', color: COLORS.muted },
    importanceBar: { height: '4px', borderRadius: '2px', marginTop: '6px', background: COLORS.border },
    importanceFill: { height: '100%', borderRadius: '2px' },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  const allMemories = useMemo(() => {
    if (!npc) return [];
    const all: MemoryRecord[] = [];
    for (const t of MEMORY_TYPES) {
      const recs = npc.memories[t] ?? [];
      all.push(...recs);
    }
    return all;
  }, [npc]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of MEMORY_TYPES) c[t] = npc?.memories[t]?.length ?? 0;
    return c;
  }, [npc]);

  const filtered = useMemo(() => {
    let list = allMemories;
    if (filter !== 'ALL') list = list.filter((m) => m.type === filter);
    if (search.trim()) list = list.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => b.importance - a.importance);
  }, [allMemories, filter, search]);

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view memories</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Memory — {npc.name}</h3>
        <div style={styles.controls}>
          <input style={styles.input} placeholder="Search memories..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="ALL">All Types</option>
            {MEMORY_TYPES.map((t) => (
              <option key={t} value={t}>{t} ({counts[t]})</option>
            ))}
          </select>
        </div>
      </div>
      <div style={styles.typeBar}>
        {MEMORY_TYPES.map((t) => (
          <span
            key={t}
            style={{
              ...styles.typeBadge,
              background: filter === t ? TYPE_COLORS[t] : 'transparent',
              color: filter === t ? '#fff' : TYPE_COLORS[t],
              borderColor: TYPE_COLORS[t],
            }}
            onClick={() => setFilter(filter === t ? 'ALL' : t)}
          >
            {t}: {counts[t]}
          </span>
        ))}
      </div>
      <div style={styles.list}>
        {filtered.length === 0 && <div style={{ ...styles.placeholder, height: 'auto', padding: '24px' }}>No memories found</div>}
        {filtered.map((m) => (
          <div key={m.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={{ ...styles.typeTag, background: TYPE_COLORS[m.type], color: '#fff' }}>{m.type}</span>
              <span style={{ fontSize: '10px', color: COLORS.muted }}>Recalls: {m.accessCount}</span>
            </div>
            <div style={styles.content}>{m.content}</div>
            <div style={styles.importanceBar}>
              <div style={{ ...styles.importanceFill, width: `${Math.min(100, m.importance * 100)}%`, background: TYPE_COLORS[m.type] }} />
            </div>
            <div style={styles.meta}>
              <span>Importance: {(m.importance * 100).toFixed(0)}%</span>
              <span>Formed: {formatTime(m.timestamp)}</span>
              <span>Last: {formatTime(m.lastAccessed)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
