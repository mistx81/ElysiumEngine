import type { NPCCore, GOAPPlan, GOAPAction } from '../../engine/types';

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

export default function GOAPPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const plan: GOAPPlan | null = npc?.currentPlan ?? null;
  const availableActions: GOAPAction[] = props.availableActions ?? [];
  const cacheStats = props.cacheStats ?? { hits: 0, misses: 0, size: 0, maxSize: 0 };

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    statusBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 },
    actionStep: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', background: COLORS.bg, borderRadius: '4px', marginBottom: '6px', border: `1px solid ${COLORS.border}` },
    stepNum: { background: COLORS.accent, color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 },
    stepBody: { flex: 1 },
    stepName: { fontWeight: 700, fontSize: '12px', marginBottom: '4px' },
    stepDetail: { fontSize: '10px', color: COLORS.muted },
    arrow: { textAlign: 'center', color: COLORS.muted, fontSize: '10px', margin: '2px 0' },
    statRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px' },
    statLabel: { color: COLORS.muted },
    statValue: { fontWeight: 700 },
    actionList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    actionItem: { padding: '6px 8px', background: COLORS.bg, borderRadius: '4px', border: `1px solid ${COLORS.border}`, fontSize: '11px' },
    actionName: { fontWeight: 700, color: COLORS.accent },
    actionCost: { float: 'right', color: COLORS.warning, fontWeight: 700 },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
    emptyText: { color: COLORS.muted, textAlign: 'center', padding: '24px', fontSize: '12px' },
  };

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view GOAP plan</div></div>;
  }

  const statusInfo = plan
    ? plan.cached
      ? { label: 'CACHED', color: COLORS.info }
      : plan.found
        ? { label: 'FOUND', color: COLORS.success }
        : { label: 'FAILED', color: COLORS.error }
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>GOAP Planner — {npc.name}</h3>
        {statusInfo && <span style={{ ...styles.statusBadge, background: statusInfo.color, color: '#fff' }}>{statusInfo.label}</span>}
      </div>

      {plan ? (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Current Plan (Depth: {plan.actions.length})</div>
          <div style={{ ...styles.statRow, marginBottom: '8px' }}>
            <span style={styles.statLabel}>Goal: <strong style={{ color: COLORS.accent }}>{plan.goal.name}</strong></span>
            <span style={styles.statValue}>Cost: {plan.totalCost}</span>
          </div>
          {plan.actions.map((action, i) => (
            <div key={i}>
              <div style={styles.actionStep}>
                <div style={styles.stepNum}>{i + 1}</div>
                <div style={styles.stepBody}>
                  <div style={styles.stepName}>{action.name} <span style={{ ...styles.actionCost, float: 'none', marginLeft: '8px' }}>cost: {action.cost}</span></div>
                  <div style={styles.stepDetail}>Pre: {JSON.stringify(action.preconditions)}</div>
                  <div style={styles.stepDetail}>Eff: {JSON.stringify(action.effects)}</div>
                  {action.target && <div style={styles.stepDetail}>Target: {action.target}</div>}
                </div>
              </div>
              {i < plan.actions.length - 1 && <div style={styles.arrow}>↓</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.section}><div style={styles.emptyText}>No active plan</div></div>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Plan Cache</div>
        <div style={styles.statRow}><span style={styles.statLabel}>Cache Size</span><span style={styles.statValue}>{cacheStats.size} / {cacheStats.maxSize}</span></div>
        <div style={styles.statRow}><span style={styles.statLabel}>Hits</span><span style={{ ...styles.statValue, color: COLORS.success }}>{cacheStats.hits}</span></div>
        <div style={styles.statRow}><span style={styles.statLabel}>Misses</span><span style={{ ...styles.statValue, color: COLORS.error }}>{cacheStats.misses}</span></div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Hit Rate</span>
          <span style={styles.statValue}>{cacheStats.hits + cacheStats.misses > 0 ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) : '0.0'}%</span>
        </div>
      </div>

      <div style={{ ...styles.section, flex: 1, overflow: 'auto' }}>
        <div style={styles.sectionTitle}>Available Actions ({availableActions.length})</div>
        <div style={styles.actionList}>
          {availableActions.length === 0 && <div style={styles.emptyText}>No actions registered</div>}
          {availableActions.map((a, i) => (
            <div key={i} style={styles.actionItem}>
              <span style={styles.actionName}>{a.name}</span>
              <span style={styles.actionCost}>cost: {a.cost}</span>
              <div style={{ fontSize: '10px', color: COLORS.muted, marginTop: '2px' }}>
                Pre: {JSON.stringify(a.preconditions)} | Eff: {JSON.stringify(a.effects)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
