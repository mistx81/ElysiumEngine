import React, { useState, useEffect, useRef, useMemo } from 'react';

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

const SEVERITY_COLORS: Record<string, string> = {
  info: COLORS.info,
  debug: COLORS.textDim,
  warning: COLORS.warning,
  error: COLORS.error,
  critical: COLORS.error,
};

const TYPE_COLORS: Record<string, string> = {
  decision: COLORS.accent,
  emotion: COLORS.info,
  memory: COLORS.success,
  goal: COLORS.warning,
  movement: COLORS.textDim,
  combat: COLORS.error,
  trade: COLORS.success,
  social: COLORS.info,
  system: COLORS.warning,
};

function Badge({ label, color, count }: { label: string; color: string; count?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: color + '22',
        border: `1px solid ${color}55`,
      }}
    >
      {label}
      {count !== undefined && <span style={{ opacity: 0.7 }}>({count})</span>}
    </span>
  );
}

export default function EventsSection(props: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef<any>(null);

  const refresh = () => {
    if (props.refreshKPIs) props.refreshKPIs();
    const runtime = props.runtimeEvents || props.events || props.kpis?.recentEvents || [];
    setEvents(Array.isArray(runtime) ? runtime : []);
  };

  useEffect(() => {
    refresh();
    if (autoRefresh) {
      timerRef.current = setInterval(refresh, 2000);
      return () => clearInterval(timerRef.current);
    }
  }, [autoRefresh, props.runtimeEvents, props.events, props.kpis]);

  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.type || e.eventType || 'unknown'));
    return ['all', ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const type = e.type || e.eventType || 'unknown';
      const sev = e.severity || e.level || 'info';
      const dataStr = JSON.stringify(e.data || e.payload || e).toLowerCase();
      const npc = (e.npc || e.npcName || e.entity || '').toLowerCase();
      const matchesType = typeFilter === 'all' || type === typeFilter;
      const matchesSev = sevFilter === 'all' || sev === sevFilter;
      const matchesSearch =
        !search ||
        dataStr.includes(search.toLowerCase()) ||
        npc.includes(search.toLowerCase()) ||
        type.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSev && matchesSearch;
    });
  }, [events, typeFilter, sevFilter, search]);

  const pinnedEvents = useMemo(() => filtered.filter((e) => pinned.has(e.id || e.timestamp + (e.type || ''))), [filtered, pinned]);

  const togglePin = (e: any) => {
    const id = e.id || e.timestamp + (e.type || '');
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearEvents = () => {
    setEvents([]);
    setPinned(new Set());
    if (props.clearEvents) props.clearEvents();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Event Stream</h2>
          <Badge label="Live" color={COLORS.success} count={events.length} />
          {pinned.size > 0 && <Badge label="Pinned" color={COLORS.warning} count={pinned.size} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btnStyle, borderColor: COLORS.accent }} onClick={exportJSON}>
            Export JSON
          </button>
          <button style={{ ...btnStyle, borderColor: COLORS.error, color: COLORS.error }} onClick={clearEvents}>
            Clear
          </button>
          <button
            style={{ ...btnStyle, borderColor: autoRefresh ? COLORS.success : COLORS.border, color: autoRefresh ? COLORS.success : COLORS.text }}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? 'Auto On' : 'Auto Off'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select style={inputStyle} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : t}
            </option>
          ))}
        </select>
        <select style={inputStyle} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          {['all', 'info', 'debug', 'warning', 'error', 'critical'].map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Severities' : s}
            </option>
          ))}
        </select>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {pinnedEvents.length > 0 && (
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.warning}55`,
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.warning, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Pinned Events
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pinnedEvents.map((e, i) => {
              const id = e.id || e.timestamp + (e.type || '');
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
                  <button style={{ ...btnStyle, padding: '2px 6px', fontSize: 11 }} onClick={() => togglePin(e)}>
                    Unpin
                  </button>
                  <span style={{ color: COLORS.textDim, minWidth: 80 }}>{new Date(e.timestamp || Date.now()).toLocaleTimeString()}</span>
                  <Badge label={e.type || e.eventType || 'unknown'} color={TYPE_COLORS[e.type || e.eventType] || COLORS.accent} />
                  <span style={{ color: COLORS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(e.data || e.payload || {}).slice(0, 120)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 110px 120px 90px 1fr 60px',
            padding: '10px 14px',
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
          }}
        >
          <span>Timestamp</span>
          <span>Type</span>
          <span>NPC</span>
          <span>Severity</span>
          <span>Data</span>
          <span>Pin</span>
        </div>
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: COLORS.textDim, fontSize: 13 }}>No events match filters.</div>
          )}
          {filtered.map((e, i) => {
            const type = e.type || e.eventType || 'unknown';
            const sev = e.severity || e.level || 'info';
            const id = e.id || e.timestamp + (e.type || '');
            const isPinned = pinned.has(id);
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 110px 120px 90px 1fr 60px',
                  padding: '8px 14px',
                  fontSize: 12,
                  borderBottom: `1px solid ${COLORS.border}`,
                  alignItems: 'center',
                  background: isPinned ? COLORS.warning + '11' : 'transparent',
                }}
              >
                <span style={{ color: COLORS.textDim, fontSize: 11 }}>{new Date(e.timestamp || Date.now()).toLocaleTimeString()}</span>
                <span>
                  <Badge label={type} color={TYPE_COLORS[type] || COLORS.accent} />
                </span>
                <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.npc || e.npcName || e.entity || '—'}
                </span>
                <span>
                  <Badge label={sev} color={SEVERITY_COLORS[sev] || COLORS.info} />
                </span>
                <span
                  style={{
                    color: COLORS.textDim,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {JSON.stringify(e.data || e.payload || {}).slice(0, 160)}
                </span>
                <button
                  style={{
                    ...btnStyle,
                    padding: '2px 8px',
                    fontSize: 11,
                    borderColor: isPinned ? COLORS.warning : COLORS.border,
                    color: isPinned ? COLORS.warning : COLORS.textDim,
                  }}
                  onClick={() => togglePin(e)}
                >
                  {isPinned ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
