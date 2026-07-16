import { useState } from 'react';
import type { NPCCore, EpisodicEvent } from '../../engine/types';

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
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function GoalsPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState('5');

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiRow: { display: 'flex', gap: '12px' },
    kpi: { flex: 1, textAlign: 'center', padding: '8px', background: COLORS.bg, borderRadius: '4px', border: `1px solid ${COLORS.border}` },
    kpiValue: { fontSize: '20px', fontWeight: 700 },
    kpiLabel: { fontSize: '9px', color: COLORS.muted, textTransform: 'uppercase', marginTop: '2px' },
    goalCard: { background: COLORS.bg, borderRadius: '4px', padding: '10px', border: `1px solid ${COLORS.accent}` },
    goalName: { fontSize: '14px', fontWeight: 700, color: COLORS.accent, marginBottom: '6px' },
    goalMeta: { display: 'flex', gap: '16px', fontSize: '11px', marginBottom: '8px' },
    priorityBar: { height: '4px', background: COLORS.border, borderRadius: '2px', overflow: 'hidden' },
    priorityFill: { height: '100%', background: COLORS.warning, borderRadius: '2px' },
    statusBadge: { display: 'inline-block', padding: '1px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700 },
    list: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' },
    item: { padding: '8px', background: COLORS.bg, borderRadius: '4px', border: `1px solid ${COLORS.border}`, fontSize: '11px' },
    itemHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
    itemDesc: { color: COLORS.muted, fontSize: '10px' },
    addForm: { display: 'flex', gap: '6px', alignItems: 'center' },
    input: { background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', flex: 1 },
    btn: { background: COLORS.accent, color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view goals</div></div>;
  }

  const completedGoals: EpisodicEvent[] = (npc.episodicEvents ?? []).filter((e) => e.type === 'goal_completed' || e.type === 'GOAL_COMPLETED');
  const failedGoals: EpisodicEvent[] = (npc.episodicEvents ?? []).filter((e) => e.type === 'goal_failed' || e.type === 'GOAL_FAILED');
  const totalAttempts = completedGoals.length + failedGoals.length;
  const completionRate = totalAttempts > 0 ? (completedGoals.length / totalAttempts) * 100 : 0;
  const currentGoal = npc.currentGoal;

  const handleAdd = () => {
    if (newGoalName.trim() && props.onAddGoal) {
      props.onAddGoal(npc.id, { name: newGoalName.trim(), priority: parseInt(newGoalPriority) || 5, targetState: {} });
      setNewGoalName('');
      setNewGoalPriority('5');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Goals — {npc.name}</h3>
      </div>

      <div style={styles.kpiRow}>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.success }}>{completedGoals.length}</div>
          <div style={styles.kpiLabel}>Completed</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.error }}>{failedGoals.length}</div>
          <div style={styles.kpiLabel}>Failed</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiValue, color: COLORS.accent }}>{completionRate.toFixed(0)}%</div>
          <div style={styles.kpiLabel}>Completion Rate</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Current Goal</div>
        {currentGoal ? (
          <div style={styles.goalCard}>
            <div style={styles.goalName}>{currentGoal.name}</div>
            <div style={styles.goalMeta}>
              <span>Priority: <strong style={{ color: COLORS.warning }}>{currentGoal.priority}</strong></span>
              <span>Status: <span style={{ ...styles.statusBadge, background: COLORS.accent, color: '#fff' }}>ACTIVE</span></span>
            </div>
            <div style={styles.priorityBar}>
              <div style={{ ...styles.priorityFill, width: `${Math.min(100, currentGoal.priority * 10)}%` }} />
            </div>
          </div>
        ) : (
          <div style={{ color: COLORS.muted, textAlign: 'center', padding: '12px', fontSize: '11px' }}>No active goal</div>
        )}
      </div>

      <div style={styles.addForm}>
        <input style={styles.input} placeholder="New goal name..." value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
        <input style={{ ...styles.input, width: '50px', flex: 'none' }} type="number" min="1" max="10" value={newGoalPriority} onChange={(e) => setNewGoalPriority(e.target.value)} />
        <button style={styles.btn} onClick={handleAdd}>Add Goal</button>
      </div>

      <div style={{ ...styles.section, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={styles.sectionTitle}>Goal History</div>
        <div style={styles.list}>
          {completedGoals.length === 0 && failedGoals.length === 0 && (
            <div style={{ color: COLORS.muted, textAlign: 'center', padding: '12px', fontSize: '11px' }}>No goal history</div>
          )}
          {[...completedGoals.map((e) => ({ e, success: true })), ...failedGoals.map((e) => ({ e, success: false }))]
            .sort((a, b) => b.e.timestamp - a.e.timestamp)
            .map(({ e, success }, i) => (
              <div key={i} style={styles.item}>
                <div style={styles.itemHeader}>
                  <strong style={{ color: success ? COLORS.success : COLORS.error }}>{success ? '✓' : '✗'} {e.description}</strong>
                  <span style={{ fontSize: '10px', color: COLORS.muted }}>{formatTime(e.timestamp)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
