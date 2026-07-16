import { useState, useEffect, useRef } from 'react';
import type { CognitiveEvent, CognitiveEventType } from '../../engine/types';

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

function categoryColor(type: CognitiveEventType): string {
  if (type.startsWith('EMOTION')) return COLORS.accent;
  if (type.startsWith('MEMORY') || type.startsWith('EPISODIC')) return COLORS.info;
  if (type.startsWith('GOAL')) return COLORS.success;
  if (type.startsWith('GOAP') || type.startsWith('DECISION') || type.startsWith('UTILITY') || type.startsWith('PREDICTION')) return COLORS.warning;
  if (type.startsWith('ECONOMY')) return COLORS.success;
  if (type.startsWith('WORLD') || type.startsWith('CHUNK') || type.startsWith('LOD')) return COLORS.warning;
  return COLORS.muted;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export default function EventBusPanel(props: any) {
  const events: CognitiveEvent[] = props.events ?? [];
  const [filter, setFilter] = useState<string>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events.length, filter]);

  const eventTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.type)))];
  const filtered = filter === 'ALL' ? events : events.filter((e) => e.type === filter);

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    badge: { background: COLORS.accent, color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 },
    controls: { display: 'flex', gap: '8px', alignItems: 'center' },
    select: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px' },
    btn: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer' },
    tableWrap: { flex: 1, overflow: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.card },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { position: 'sticky', top: 0, background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: COLORS.muted, zIndex: 1 },
    td: { padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, fontSize: '11px', verticalAlign: 'top' },
    typeCell: { fontFamily: 'monospace', fontWeight: 700 },
    dataCell: { maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: COLORS.muted },
    row: { cursor: 'pointer' },
    dot: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px', verticalAlign: 'middle' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={styles.title}>Event Bus</h3>
          <span style={styles.badge}>{events.length}</span>
        </div>
        <div style={styles.controls}>
          <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button style={styles.btn} onClick={() => props.clearEvents?.()}>Clear</button>
        </div>
      </div>
      <div ref={scrollRef} style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>NPC</th>
              <th style={styles.th}>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: COLORS.muted, padding: '24px' }}>No events</td></tr>
            )}
            {filtered.map((ev) => {
              const color = categoryColor(ev.type);
              return (
                <tr key={ev.id} style={styles.row}>
                  <td style={styles.td}>{formatTime(ev.timestamp)}</td>
                  <td style={{ ...styles.td, ...styles.typeCell }}>
                    <span style={{ ...styles.dot, background: color }} />
                    {ev.type}
                  </td>
                  <td style={styles.td}>{ev.npcId ?? '—'}</td>
                  <td style={{ ...styles.td, ...styles.dataCell }}>{ev.data ? JSON.stringify(ev.data) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
