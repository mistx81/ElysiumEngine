import { useMemo } from 'react';
import type { NPCCore, UtilityDecision } from '../../engine/types';

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

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DecisionsPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const predictions = npc?.predictions ?? [];

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    kpiRow: { display: 'flex', gap: '8px' },
    kpi: { flex: 1, textAlign: 'center', padding: '8px', background: COLORS.card, borderRadius: '4px', border: `1px solid ${COLORS.border}` },
    kpiValue: { fontSize: '18px', fontWeight: 700 },
    kpiLabel: { fontSize: '9px', color: COLORS.muted, textTransform: 'uppercase', marginTop: '2px' },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    chart: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` },
    chartBar: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
    barFill: { width: '100%', borderRadius: '3px 3px 0 0', minHeight: '2px', transition: 'height 0.3s' },
    barLabel: { fontSize: '8px', color: COLORS.muted, textAlign: 'center', wordBreak: 'break-word', maxWidth: '60px' },
    barCount: { fontSize: '9px', fontWeight: 700 },
    list: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' },
    item: { padding: '8px', background: COLORS.bg, borderRadius: '4px', border: `1px solid ${COLORS.border}`, fontSize: '11px' },
    itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    actionName: { fontWeight: 700, color: COLORS.accent },
    scoreBadge: { padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 },
    itemMeta: { display: 'flex', gap: '12px', fontSize: '10px', color: COLORS.muted },
    overrideTag: { fontSize: '9px', color: COLORS.error, fontWeight: 700 },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  const decisions: UtilityDecision[] = npc?.decisionHistory ?? [];

  const distribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of decisions) map[d.action] = (map[d.action] ?? 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [decisions]);

  const predictionAccuracy = useMemo(() => {
    const verified = predictions.filter((p) => p.verified);
    if (verified.length === 0) return 0;
    const correct = verified.filter((p) => p.predictedAction === p.actualAction).length;
    return (correct / verified.length) * 100;
  }, [predictions]);

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view decisions</div></div>;
  }

  const maxCount = Math.max(...distribution.map(([, c]) => c), 1);
  const barColors = [COLORS.accent, COLORS.success, COLORS.warning, COLORS.error, COLORS.info, '#ec4899', '#84cc16', '#a855f7'];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Decisions — {npc.name}</h3>
      </div>

      <div style={styles.kpiRow}>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.accent }}>{decisions.length}</div>
          <div style={styles.kpiLabel}>Total Decisions</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.info }}>{distribution.length}</div>
          <div style={styles.kpiLabel}>Unique Actions</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: predictions.length > 0 ? (predictionAccuracy > 50 ? COLORS.success : COLORS.warning) : COLORS.muted }}>
            {predictions.length > 0 ? `${predictionAccuracy.toFixed(0)}%` : '—'}
          </div>
          <div style={styles.kpiLabel}>Prediction Accuracy</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Action Distribution</div>
        {distribution.length === 0 ? (
          <div style={{ color: COLORS.muted, textAlign: 'center', padding: '12px', fontSize: '11px' }}>No decisions yet</div>
        ) : (
          <div style={styles.chart}>
            {distribution.slice(0, 10).map(([action, count], i) => (
              <div key={action} style={styles.chartBar}>
                <span style={{ ...styles.barCount, color: barColors[i % barColors.length] }}>{count}</span>
                <div style={{ ...styles.barFill, height: `${(count / maxCount) * 60}px`, background: barColors[i % barColors.length] }} />
                <span style={styles.barLabel}>{action}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.section, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={styles.sectionTitle}>Decision History</div>
        <div style={styles.list}>
          {decisions.length === 0 && <div style={{ color: COLORS.muted, textAlign: 'center', padding: '12px', fontSize: '11px' }}>No decisions recorded</div>}
          {decisions.slice().reverse().map((d, i) => (
            <div key={i} style={styles.item}>
              <div style={styles.itemHeader}>
                <span style={styles.actionName}>{d.action}</span>
                <span style={{ ...styles.scoreBadge, background: d.score > 0.7 ? COLORS.success : d.score > 0.4 ? COLORS.warning : COLORS.error, color: '#fff' }}>
                  {d.score.toFixed(3)}
                </span>
              </div>
              <div style={styles.itemMeta}>
                <span>{formatTime(d.timestamp)}</span>
                {d.isCriticalOverride && <span style={styles.overrideTag}>CRITICAL OVERRIDE</span>}
              </div>
              {d.factors && Object.keys(d.factors).length > 0 && (
                <div style={{ fontSize: '9px', color: COLORS.muted, marginTop: '4px' }}>
                  {Object.entries(d.factors).map(([k, v]) => `${k}:${(v as number).toFixed(2)}`).join('  ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
