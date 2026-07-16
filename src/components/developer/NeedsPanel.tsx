import type { NPCCore, NeedType } from '../../engine/types';

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

const NEEDS: NeedType[] = ['hunger', 'thirst', 'sleep', 'social', 'safety', 'esteem', 'selfActualization'];

const NEED_ICONS: Record<NeedType, string> = {
  hunger: '🍽',
  thirst: '💧',
  sleep: '😴',
  social: '👥',
  safety: '🛡',
  esteem: '⭐',
  selfActualization: '🧠',
};

function needColor(value: number): string {
  if (value > 80) return COLORS.error;
  if (value > 60) return COLORS.warning;
  return COLORS.success;
}

function needLabel(type: NeedType): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1').trim();
}

export default function NeedsPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const previousNeeds = props.previousNeeds ?? null;

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    summary: { display: 'flex', gap: '8px' },
    summaryBadge: { padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700 },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '11px', fontWeight: 700, marginBottom: '10px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    needRow: { marginBottom: '14px' },
    needHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    needLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 },
    needIcon: { fontSize: '14px' },
    needValue: { fontSize: '12px', fontWeight: 700 },
    changeIndicator: { fontSize: '10px', marginLeft: '6px' },
    barTrack: { height: '10px', background: COLORS.border, borderRadius: '5px', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: '5px', transition: 'width 0.3s, background 0.3s' },
    thresholdMarks: { display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: COLORS.muted, marginTop: '2px' },
    legend: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: COLORS.muted },
    legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view needs</div></div>;
  }

  const needs = npc.needs;
  const urgentCount = NEEDS.filter((n) => needs[n] > 80).length;
  const warningCount = NEEDS.filter((n) => needs[n] > 60 && needs[n] <= 80).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Needs — {npc.name}</h3>
        <div style={styles.summary}>
          {urgentCount > 0 && <span style={{ ...styles.summaryBadge, background: COLORS.error, color: '#fff' }}>{urgentCount} URGENT</span>}
          {warningCount > 0 && <span style={{ ...styles.summaryBadge, background: COLORS.warning, color: '#fff' }}>{warningCount} WARNING</span>}
          {urgentCount === 0 && warningCount === 0 && <span style={{ ...styles.summaryBadge, background: COLORS.success, color: '#fff' }}>ALL OK</span>}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Need Levels</div>
        {NEEDS.map((need) => {
          const value = needs[need] ?? 0;
          const color = needColor(value);
          const prevValue = previousNeeds?.[need] ?? value;
          const delta = value - prevValue;
          return (
            <div key={need} style={styles.needRow}>
              <div style={styles.needHeader}>
                <span style={styles.needLabel}>
                  <span style={styles.needIcon}>{NEED_ICONS[need]}</span>
                  {needLabel(need)}
                </span>
                <span style={{ ...styles.needValue, color }}>
                  {value.toFixed(1)}
                  {delta !== 0 && (
                    <span style={{ ...styles.changeIndicator, color: delta > 0 ? COLORS.error : COLORS.success }}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${Math.min(100, value)}%`, background: color }} />
              </div>
              <div style={styles.thresholdMarks}>
                <span>0</span>
                <span style={{ color: COLORS.success }}>60</span>
                <span style={{ color: COLORS.warning }}>80</span>
                <span style={{ color: COLORS.error }}>100</span>
              </div>
            </div>
          );
        })}
        <div style={styles.legend}>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: COLORS.success }} /> Satisfied</div>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: COLORS.warning }} /> Warning</div>
          <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: COLORS.error }} /> Urgent</div>
        </div>
      </div>
    </div>
  );
}
