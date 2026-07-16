import { useMemo } from 'react';

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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  statBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
  },
  statLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: COLORS.textMuted,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: COLORS.text,
  },
  gaugeWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  gaugeBar: {
    flex: 1,
    height: '10px',
    backgroundColor: COLORS.bg,
    borderRadius: '5px',
    overflow: 'hidden',
    border: `1px solid ${COLORS.border}`,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
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
  },
  td: {
    padding: '8px 10px',
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  scrollArea: { maxHeight: '320px', overflowY: 'auto' },
};

export default function SchedulerPanel(props: any) {
  const schedStats = props.schedStats ?? {
    totalTasks: 0,
    totalExecutions: 0,
    tasksOverBudget: 0,
    budgetUtilization: 0,
    budgetMs: 16,
    tasks: [],
  };

  const tasks = schedStats.tasks ?? [];
  const utilizationPct = Math.round((schedStats.budgetUtilization ?? 0) * 100);

  const gaugeColor = useMemo(() => {
    if (utilizationPct >= 75) return COLORS.error;
    if (utilizationPct >= 50) return COLORS.warning;
    return COLORS.success;
  }, [utilizationPct]);

  const formatLastRun = (ms: number) => {
    if (!ms) return 'never';
    const ago = Date.now() - ms;
    if (ago < 1000) return `${Math.round(ago)}ms ago`;
    if (ago < 60000) return `${(ago / 1000).toFixed(1)}s ago`;
    return `${(ago / 60000).toFixed(1)}m ago`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Scheduler Overview</div>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total Tasks</div>
            <div style={styles.statValue}>{schedStats.totalTasks}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total Executions</div>
            <div style={styles.statValue}>{schedStats.totalExecutions.toLocaleString()}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Over Budget</div>
            <div style={{ ...styles.statValue, color: schedStats.tasksOverBudget > 0 ? COLORS.warning : COLORS.text }}>
              {schedStats.tasksOverBudget}
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Budget (ms)</div>
            <div style={styles.statValue}>{schedStats.budgetMs}ms</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Budget Utilization</div>
        <div style={styles.gaugeWrap}>
          <div style={styles.gaugeBar}>
            <div
              style={{ ...styles.gaugeFill, width: `${utilizationPct}%`, backgroundColor: gaugeColor }}
            />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: gaugeColor, minWidth: '48px', textAlign: 'right' }}>
            {utilizationPct}%
          </span>
        </div>
        <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '8px' }}>
          {schedStats.tasksOverBudget} of {schedStats.totalTasks} tasks exceeded their per-task budget allocation.
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Registered Tasks</div>
        <div style={styles.scrollArea}>
          {tasks.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
              No tasks registered.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Interval</th>
                  <th style={styles.th}>Last Run</th>
                  <th style={styles.th}>Executions</th>
                  <th style={styles.th}>Avg (ms)</th>
                  <th style={styles.th}>Max (ms)</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => (
                  <tr key={task.id}>
                    <td style={styles.td}>{task.name}</td>
                    <td style={styles.td}>{task.intervalMs > 0 ? `${task.intervalMs}ms` : 'every tick'}</td>
                    <td style={styles.td}>{formatLastRun(task.lastRunMs)}</td>
                    <td style={styles.td}>{task.executionCount.toLocaleString()}</td>
                    <td style={styles.td}>{task.avgExecutionMs.toFixed(2)}</td>
                    <td style={styles.td}>{task.maxExecutionMs.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: task.isOverBudget ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          color: task.isOverBudget ? COLORS.error : COLORS.success,
                        }}
                      >
                        {task.isOverBudget ? 'OVER BUDGET' : 'OK'}
                      </span>
                    </td>
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
