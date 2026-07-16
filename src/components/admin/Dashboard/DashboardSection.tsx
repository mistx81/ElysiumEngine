import { useEffect, useState, useCallback } from "react";

const styles: Record<string, any> = {
  container: {
    padding: "24px",
    backgroundColor: "#0a0e17",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: 0,
  },
  refreshBadge: {
    fontSize: "12px",
    color: "#06b6d4",
    padding: "4px 10px",
    border: "1px solid #2a3548",
    borderRadius: "12px",
    backgroundColor: "#151c2c",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  kpiCard: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  kpiTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kpiIcon: {
    fontSize: "22px",
  },
  kpiLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  trend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: 600,
  },
  trendUp: { color: "#10b981" },
  trendDown: { color: "#ef4444" },
  trendFlat: { color: "#94a3b8" },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  panel: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "18px",
  },
  panelTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "14px",
    color: "#3b82f6",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #2a3548",
    fontSize: "14px",
  },
  statusRowLast: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "14px",
  },
  statusLabel: { color: "#94a3b8" },
  statusValue: { fontWeight: 600 },
  badge: {
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
  },
  badgeRunning: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  badgePaused: { backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  activityItem: {
    display: "flex",
    gap: "10px",
    padding: "8px",
    backgroundColor: "#0a0e17",
    borderRadius: "6px",
    fontSize: "13px",
  },
  activityDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginTop: "5px",
    flexShrink: 0,
  },
  activityText: { flex: 1 },
  activityTime: { color: "#64748b", fontSize: "11px" },
  empty: { color: "#64748b", fontSize: "13px", textAlign: "center", padding: "20px" },
};

const dotColor = (action: string): string => {
  if (action?.includes("create") || action?.includes("spawn")) return "#10b981";
  if (action?.includes("delete") || action?.includes("kill") || action?.includes("ban")) return "#ef4444";
  if (action?.includes("update") || action?.includes("change")) return "#f59e0b";
  return "#3b82f6";
};

const formatTime = (ts: string | number): string => {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  } catch {
    return String(ts);
  }
};

export default function DashboardSection(props: any) {
  const [kpis, setKpis] = useState<any>(props?.kpis ?? null);
  const [trends, setTrends] = useState<Record<string, number>>({});

  const doRefresh = useCallback(async () => {
    if (props?.refreshKPIs) {
      try {
        const result = await props.refreshKPIs();
        if (result && typeof result === "object") {
          setTrends((prev) => {
            const next: Record<string, number> = {};
            Object.keys(result).forEach((k) => {
              const oldVal = prev[k];
              const newVal = result[k];
              if (oldVal !== undefined && typeof newVal === "number") {
                next[k] = newVal > oldVal ? 1 : newVal < oldVal ? -1 : 0;
              } else {
                next[k] = 0;
              }
            });
            return next;
          });
          setKpis(result);
        }
      } catch {
        // ignore
      }
    }
  }, [props]);

  useEffect(() => {
    doRefresh();
    const interval = setInterval(doRefresh, 5000);
    return () => clearInterval(interval);
  }, [doRefresh]);

  const kpiDefs = [
    { key: "totalUsers", label: "Total Users", icon: "👥" },
    { key: "onlineUsers", label: "Online Users", icon: "🟢" },
    { key: "npcCount", label: "NPC Count", icon: "🤖" },
    { key: "runningSimulations", label: "Running Simulations", icon: "⚙️" },
    { key: "worldEvents", label: "World Events", icon: "🌍" },
    { key: "avgTickTime", label: "Avg Tick Time (ms)", icon: "⏱️" },
    { key: "memoryUsage", label: "Memory Usage (MB)", icon: "💾" },
    { key: "apiCalls", label: "API Calls", icon: "📡" },
  ];

  const renderTrend = (key: string) => {
    const t = trends[key];
    if (t === undefined || t === 0) {
      return <span style={styles.trendFlat}>—</span>;
    }
    if (t > 0) {
      return (
        <span style={{ ...styles.trend, ...styles.trendUp }}>
          ▲ {t > 0 ? "up" : ""}
        </span>
      );
    }
    return (
      <span style={{ ...styles.trend, ...styles.trendDown }}>
        ▼ down
      </span>
    );
  };

  const simRunning = kpis?.simulationRunning ?? false;
  const auditLogs = props?.auditLogs ?? [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <span style={styles.refreshBadge}>Auto-refresh: 5s</span>
      </div>

      <div style={styles.kpiGrid}>
        {kpiDefs.map((kpi) => {
          const val = kpis?.[kpi.key];
          const display = val !== undefined && val !== null ? String(val) : "—";
          return (
            <div key={kpi.key} style={styles.kpiCard}>
              <div style={styles.kpiTop}>
                <span style={styles.kpiIcon}>{kpi.icon}</span>
                {renderTrend(kpi.key)}
              </div>
              <div style={styles.kpiLabel}>{kpi.label}</div>
              <div style={styles.kpiValue}>{display}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.twoCol}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>System Status</div>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Simulation</span>
            <span
              style={{
                ...styles.badge,
                ...(simRunning ? styles.badgeRunning : styles.badgePaused),
              }}
            >
              {simRunning ? "Running" : "Paused"}
            </span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Tick Count</span>
            <span style={styles.statusValue}>{kpis?.tickCount ?? "—"}</span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>Cache Hit Rate</span>
            <span style={styles.statusValue}>
              {kpis?.cacheHitRate !== undefined ? `${kpis.cacheHitRate}%` : "—"}
            </span>
          </div>
          <div style={styles.statusRowLast}>
            <span style={styles.statusLabel}>Batch Writes</span>
            <span style={styles.statusValue}>{kpis?.batchWrites ?? "—"}</span>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Recent Activity</div>
          {auditLogs.length === 0 ? (
            <div style={styles.empty}>No recent activity</div>
          ) : (
            <div style={styles.activityList}>
              {auditLogs.slice(0, 10).map((log: any, idx: number) => (
                <div key={log?.id ?? idx} style={styles.activityItem}>
                  <div
                    style={{
                      ...styles.activityDot,
                      backgroundColor: dotColor(log?.action ?? ""),
                    }}
                  />
                  <div style={styles.activityText}>
                    <div>{log?.action ?? "unknown"} — {log?.actorEmail ?? log?.actor ?? "system"}</div>
                    {log?.timestamp && (
                      <div style={styles.activityTime}>{formatTime(log.timestamp)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
