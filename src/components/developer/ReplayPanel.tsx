import { useState, useEffect, useRef, useMemo } from 'react';

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

const SPEEDS = [0.25, 0.5, 1, 2, 4];

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
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  scrubber: {
    width: '100%',
    cursor: 'pointer',
    accentColor: COLORS.accent,
  },
  posLabel: {
    fontSize: '12px',
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    minWidth: '90px',
    textAlign: 'right',
  },
  speedSelect: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  detailBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: COLORS.text,
    minHeight: '120px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  eventRow: {
    display: 'flex',
    gap: '8px',
    padding: '6px 10px',
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: '12px',
    cursor: 'pointer',
  },
  eventRowActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  scrollArea: { maxHeight: '280px', overflowY: 'auto' },
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: 'rgba(6,182,212,0.15)',
    color: COLORS.info,
  },
};

export default function ReplayPanel(props: any) {
  const events = props.events ?? [];
  const [position, setPosition] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (position > events.length) setPosition(events.length);
  }, [events.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (position >= events.length) {
      setPlaying(false);
      return;
    }
    const interval = 600 / speed;
    timerRef.current = setInterval(() => {
      setPosition((p) => {
        if (p >= events.length) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, events.length]);

  const currentEvent = useMemo(() => {
    if (events.length === 0 || position === 0) return null;
    return events[Math.min(position - 1, events.length - 1)];
  }, [events, position]);

  const stepForward = () => {
    setPlaying(false);
    setPosition((p) => Math.min(p + 1, events.length));
  };

  const stepBackward = () => {
    setPlaying(false);
    setPosition((p) => Math.max(p - 1, 0));
  };

  const togglePlay = () => {
    if (position >= events.length) setPosition(1);
    setPlaying((p) => !p);
  };

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Replay Controls</div>
        <div style={{ ...styles.btnRow, marginBottom: '12px' }}>
          <button style={styles.btnGhost} onClick={stepBackward} disabled={position === 0}>◀ Step</button>
          <button style={styles.btn} onClick={togglePlay}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button style={styles.btnGhost} onClick={stepForward} disabled={position >= events.length}>Step ▶</button>
          <button
            style={styles.btnGhost}
            onClick={() => { setPlaying(false); setPosition(0); }}
          >
            ⏹ Reset
          </button>
          <span style={{ fontSize: '11px', color: COLORS.textMuted, marginLeft: '4px' }}>Speed:</span>
          <select style={styles.speedSelect} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
          <span style={styles.posLabel}>
            {position} / {events.length}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(events.length, 1)}
          value={position}
          style={styles.scrubber}
          onChange={(e) => { setPlaying(false); setPosition(Number(e.target.value)); }}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Current Event</div>
        {currentEvent ? (
          <div style={styles.detailBox}>
            <div style={{ marginBottom: '6px' }}>
              <span style={styles.badge}>{currentEvent.type ?? 'EVENT'}</span>
              <span style={{ marginLeft: '8px', color: COLORS.textMuted }}>
                {formatTime(currentEvent.timestamp)}
              </span>
            </div>
            <div>id: {currentEvent.id}</div>
            <div>source: {currentEvent.source}</div>
            {currentEvent.npcId && <div>npcId: {currentEvent.npcId}</div>}
            <div style={{ marginTop: '6px', color: COLORS.textMuted }}>data:</div>
            <div>{JSON.stringify(currentEvent.data ?? {}, null, 2)}</div>
          </div>
        ) : (
          <div style={{ ...styles.detailBox, color: COLORS.textMuted }}>
            {events.length === 0 ? 'No events recorded.' : 'Move the scrubber or press Play to inspect events.'}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Event Timeline ({events.length} events)</div>
        <div style={styles.scrollArea}>
          {events.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
              No events in history.
            </div>
          ) : (
            events.map((ev: any, i: number) => (
              <div
                key={ev.id ?? i}
                style={{ ...styles.eventRow, ...(i + 1 === position ? styles.eventRowActive : {}) }}
                onClick={() => { setPlaying(false); setPosition(i + 1); }}
              >
                <span style={{ color: COLORS.textMuted, minWidth: '70px' }}>{formatTime(ev.timestamp)}</span>
                <span style={styles.badge}>{ev.type}</span>
                <span style={{ color: COLORS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.source}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
