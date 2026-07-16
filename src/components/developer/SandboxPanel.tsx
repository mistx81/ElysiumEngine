import { useState, useRef, useEffect } from 'react';

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

const ITEM_TYPES = ['food', 'water', 'weapon', 'tool', 'medicine', 'clothing', 'luxury', 'material', 'book'];

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
  row: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.textMuted },
  select: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    minWidth: '160px',
    cursor: 'pointer',
    outline: 'none',
  },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    minWidth: '160px',
    outline: 'none',
  },
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  logArea: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: COLORS.text,
    height: '200px',
    overflowY: 'auto',
  },
  logEntry: { padding: '3px 0', borderBottom: `1px solid ${COLORS.border}` },
  slider: { width: '140px', cursor: 'pointer', accentColor: COLORS.accent },
};

export default function SandboxPanel(props: any) {
  const npcs = props.npcs ?? [];
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [itemType, setItemType] = useState<string>('food');
  const [amount, setAmount] = useState<number>(50);
  const [topic, setTopic] = useState<string>('');
  const [results, setResults] = useState<string[]>([]);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (npcs.length > 0 && !sourceId) setSourceId(npcs[0].id);
  }, [npcs, sourceId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [results]);

  const addResult = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  const wrap = (fn: string, ...args: any[]) => {
    try {
      const handler = props[fn];
      if (typeof handler !== 'function') {
        addResult(`ERROR: "${fn}" handler not available on props.`);
        return;
      }
      handler(...args);
      addResult(`Triggered ${fn}(${args.map((a) => JSON.stringify(a)).join(', ')})`);
    } catch (err: any) {
      addResult(`EXCEPTION in ${fn}: ${err?.message ?? err}`);
    }
  };

  const trigger = (type: string) => {
    if (!sourceId) {
      addResult('ERROR: Select a source NPC first.');
      return;
    }
    switch (type) {
      case 'betrayal':
        if (!targetId) return addResult('ERROR: Select a target NPC.');
        wrap('triggerBetrayal', sourceId, targetId);
        break;
      case 'conversation':
        if (!targetId) return addResult('ERROR: Select a target NPC.');
        wrap('triggerConversation', sourceId, targetId);
        break;
      case 'itemFound':
        wrap('triggerItemFound', sourceId, itemType);
        break;
      case 'attack':
        if (!targetId) return addResult('ERROR: Select a target NPC.');
        wrap('triggerAttack', sourceId, targetId);
        break;
      case 'reward':
        wrap('triggerReward', sourceId, amount);
        break;
      case 'rumor':
        if (!topic.trim()) return addResult('ERROR: Enter a rumor topic.');
        if (!targetId) return addResult('ERROR: Select a target NPC.');
        wrap('triggerRumor', sourceId, topic.trim(), targetId);
        break;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>NPC Selectors</div>
        <div style={styles.row}>
          <div style={styles.field}>
            <span style={styles.label}>Source NPC</span>
            <select style={styles.select} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">— Select —</option>
              {npcs.map((n: any) => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Target NPC</span>
            <select style={styles.select} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">— Select —</option>
              {npcs.map((n: any) => (
                <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Event Parameters</div>
        <div style={styles.row}>
          <div style={styles.field}>
            <span style={styles.label}>Item Type</span>
            <select style={styles.select} value={itemType} onChange={(e) => setItemType(e.target.value)}>
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Reward Amount ({amount})</span>
            <input
              type="range"
              min="1"
              max="500"
              value={amount}
              style={styles.slider}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Rumor Topic</span>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. stolen_gold"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Trigger Events</div>
        <div style={styles.btnRow}>
          <button style={styles.btn} onClick={() => trigger('betrayal')}>Trigger Betrayal</button>
          <button style={styles.btn} onClick={() => trigger('conversation')}>Trigger Conversation</button>
          <button style={styles.btn} onClick={() => trigger('itemFound')}>Trigger Item Found</button>
          <button style={styles.btn} onClick={() => trigger('attack')}>Trigger Attack</button>
          <button style={styles.btn} onClick={() => trigger('reward')}>Trigger Reward</button>
          <button style={styles.btn} onClick={() => trigger('rumor')}>Trigger Rumor</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Results Log</div>
          <button
            style={{ ...styles.btn, backgroundColor: COLORS.border }}
            onClick={() => setResults([])}
          >
            Clear
          </button>
        </div>
        <div ref={logRef} style={styles.logArea}>
          {results.length === 0 ? (
            <div style={{ color: COLORS.textMuted }}>No events triggered yet.</div>
          ) : (
            results.map((r, i) => (
              <div key={i} style={styles.logEntry}>{r}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
