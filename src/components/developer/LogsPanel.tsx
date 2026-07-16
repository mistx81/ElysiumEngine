import { useState, useMemo, useRef, useEffect } from 'react';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const LEVELS = ['debug', 'info', 'warn', 'error'] as const;

const LEVEL_COLORS: Record<string, string> = {
  debug: COLORS.textMuted,
  info: COLORS.info,
  warn: COLORS.warning,
  error: COLORS.error,
};

const styles: Record<string, any> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' },
  card: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '16px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: COLORS.textMuted,
    marginBottom: '12px',
  },
  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' },
  searchInput: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    minWidth: '200px',
    outline: 'none',
  },
  checkboxRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: COLORS.text,
  },
  btn: {
    backgroundColor: COLORS.border,
    color: COLORS.text,
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnAccent: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: COLORS.text,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    backgroundColor: COLORS.card,
  },
  td: { padding: '6px 10px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.text },
  levelBadge: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  scrollArea: { maxHeight: '480px', overflowY: 'auto' },
  countBadge: {
    fontSize: '12px',
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
};

export default function LogsPanel(props: any) {
  const logs = props.logs ?? [];
  const [search, setSearch] = useState<string>('');
  const [activeLevels, setActiveLevels] = useState<Record<string, boolean>>({
    debug: true,
    info: true,
    warn: true,
    error: true,
  });
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log: any) => {
      if (!activeLevels[log.level]) return false;
      if (!q) return true;
      const msg = String(log.message ?? '').toLowerCase();
      const src = String(log.source ?? '').toLowerCase();
      return msg.includes(q) || src.includes(q);
    });
  }, [logs, search, activeLevels]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered, autoScroll]);

  const toggleLevel = (lvl: string) => {
    setActiveLevels((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Log Viewer</div>
          <span style={styles.countBadge}>
            {filtered.length} shown / {logs.length} total
          </span>
        </div>
        <div style={styles.toolbar}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={styles.checkboxRow}>
            {LEVELS.map((lvl) => (
              <label key={lvl} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={activeLevels[lvl]}
                  onChange={() => toggleLevel(lvl)}
                  style={{ accentColor: LEVEL_COLORS[lvl] }}
                />
                <span style={{ color: LEVEL_COLORS[lvl] }}>{lvl}</span>
              </label>
            ))}
          </div>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={() => setAutoScroll((a) => !a)}
              style={{ accentColor: COLORS.accent }}
            />
            Auto-scroll
          </label>
          <button style={styles.btn} onClick={() => props.clearLogs?.()}>
            Clear Logs
          </button>
        </div>
        <div ref={scrollRef} style={styles.scrollArea}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
              {logs.length === 0 ? 'No logs recorded.' : 'No logs match the current filters.'}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Level</th>
                  <th style={styles.th}>Source</th>
                  <th style={styles.th}>Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', color: COLORS.textMuted, whiteSpace: 'nowrap' }}>
                      {formatTime(log.timestamp)}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.levelBadge,
                        backgroundColor: `${LEVEL_COLORS[log.level]}22`,
                        color: LEVEL_COLORS[log.level],
                      }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace' }}>{log.source ?? '—'}</td>
                    <td style={styles.td}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
