import { useState, useMemo } from 'react';
import type { ElysiumAPI } from '../../sdk/public-api';

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

const SDK_VERSION = '1.0.0';

const STATIC_API_METHODS = [
  'createNPC(partial)',
  'removeNPC(id)',
  'getNPC(id)',
  'getAllNPCs()',
  'setGoal(npcId, goal)',
  'planGoal(npcId, worldState)',
  'tick()',
  'start()',
  'stop()',
  'emit(event)',
  'subscribe(eventType, handler)',
  'unsubscribe(id)',
  'getWorldState()',
  'triggerWorldEvent(type)',
  'getEconomyPrice(itemType)',
  'trade(buyerId, sellerId, itemType, qty)',
  'setPlayerPosition(pos)',
  'getNPCLOD(npcId)',
  'exportState()',
  'importState(json)',
  'getStats()',
  'getPluginManager()',
  'getDebugPanels()',
  'getRuntime()',
];

const CODE_SNIPPETS: { title: string; code: string }[] = [
  {
    title: 'Create an API instance',
    code: `import { ElysiumAPI } from '@elysium/sdk';

const api = new ElysiumAPI({ autoStart: true, tickIntervalMs: 1000 });`,
  },
  {
    title: 'Create and manage NPCs',
    code: `const npc = api.createNPC({ name: 'Aria', age: 28 });
api.setGoal(npc.id, { name: 'find_food', priority: 8, isSatisfied: (ws) => ws.hunger < 20 });`,
  },
  {
    title: 'Subscribe to events',
    code: `const subId = api.subscribe('STATE_CHANGED', (event) => {
  console.log('NPC state changed:', event.npcId, event.data);
});`,
  },
  {
    title: 'Export / Import state',
    code: `const json = api.exportState();
localStorage.setItem('elysium-save', json);
api.importState(localStorage.getItem('elysium-save'));`,
  },
];

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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  statBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
  },
  statLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.textMuted, marginBottom: '4px' },
  statValue: { fontSize: '20px', fontWeight: 700, color: COLORS.text },
  methodList: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto' },
  methodItem: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: COLORS.text,
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
  },
  snippetCard: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
  },
  snippetTitle: { fontSize: '12px', fontWeight: 600, color: COLORS.accent, marginBottom: '6px' },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: COLORS.text,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.5',
  },
  copyBtn: {
    backgroundColor: 'transparent',
    color: COLORS.textMuted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    float: 'right',
  },
  versionBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: 'rgba(16,185,129,0.15)',
    color: COLORS.success,
  },
};

export default function SDKPanel(props: any) {
  const [copied, setCopied] = useState<string | null>(null);

  const sdkStats = useMemo(() => {
    const runtime = props.runtime;
    if (runtime && typeof runtime.getStats === 'function') {
      try {
        return runtime.getStats();
      } catch {
        return null;
      }
    }
    return null;
  }, [props.runtime]);

  const apiMethods = useMemo(() => {
    const runtime = props.runtime;
    if (runtime && typeof runtime === 'object') {
      const proto = Object.getPrototypeOf(runtime);
      if (proto) {
        const methods = Object.getOwnPropertyNames(proto).filter(
          (m) => m !== 'constructor' && typeof (runtime as any)[m] === 'function',
        );
        if (methods.length > 0) return methods;
      }
    }
    return STATIC_API_METHODS;
  }, [props.runtime]);

  const copyToClipboard = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const panelCount = sdkStats?.registeredDebugPanels ?? 0;
  const pluginCount = sdkStats?.registeredPlugins ?? 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>SDK Information</div>
          <span style={styles.versionBadge}>v{SDK_VERSION}</span>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Registered Plugins</div>
            <div style={styles.statValue}>{pluginCount}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Debug Panels</div>
            <div style={styles.statValue}>{panelCount}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>API Calls</div>
            <div style={styles.statValue}>{sdkStats?.apiCalls?.toLocaleString() ?? '—'}</div>
          </div>
        </div>
        {sdkStats && (
          <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '10px' }}>
            Uptime: {((sdkStats.uptime ?? 0) / 1000).toFixed(1)}s ·
            Actions: {sdkStats.registeredActions ?? 0} ·
            Goals: {sdkStats.registeredGoals ?? 0}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Public API Methods</div>
        <div style={styles.methodList}>
          {apiMethods.map((m: string) => (
            <div key={m} style={styles.methodItem}>{m}</div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Code Examples</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CODE_SNIPPETS.map((snippet, i) => (
            <div key={i} style={styles.snippetCard}>
              <div style={styles.snippetTitle}>
                {snippet.title}
                <button
                  style={styles.copyBtn}
                  onClick={() => copyToClipboard(snippet.code, `snippet-${i}`)}
                >
                  {copied === `snippet-${i}` ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre style={styles.codeBlock}>{snippet.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
