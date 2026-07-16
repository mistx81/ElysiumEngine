import { useEffect, useState, useCallback } from "react";

const styles: Record<string, any> = {
  container: {
    padding: "24px",
    backgroundColor: "#0a0e17",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: { fontSize: "24px", fontWeight: 700, margin: "0 0 20px 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
  card: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "20px",
  },
  cardTitle: { fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" },
  fullCard: { gridColumn: "1 / -1" },
  tableWrap: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    overflow: "auto",
    maxHeight: "400px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#94a3b8",
    borderBottom: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: { padding: "10px 12px", fontSize: "13px", borderBottom: "1px solid #2a3548" },
  badge: { padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, display: "inline-block" },
  badgeActive: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  badgeRevoked: { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" },
  badgeWarn: { backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  mono: { fontFamily: "monospace", fontSize: "12px" },
  empty: { textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "14px" },
  statRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" },
  statLabel: { color: "#94a3b8" },
  statValue: { fontWeight: 600 },
  flagRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a3548" },
  flagLabel: { fontSize: "14px" },
  flagIndicator: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" },
  flagDot: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" },
  flagOn: { backgroundColor: "#10b981" },
  flagOff: { backgroundColor: "#ef4444" },
  btn: {
    padding: "5px 10px",
    borderRadius: "5px",
    border: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  btnDanger: { borderColor: "#ef4444", color: "#ef4444" },
  btnSuccess: { borderColor: "#10b981", color: "#10b981" },
  input: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "10px",
  },
  permGroup: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" },
  permLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "13px",
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
  },
  permLabelActive: { borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)" },
  progressBar: { width: "100%", height: "8px", backgroundColor: "#0a0e17", borderRadius: "4px", overflow: "hidden", marginTop: "8px" },
  progressFill: { height: "100%", backgroundColor: "#10b981", borderRadius: "4px" },
};

const PERMS = ["read", "write", "admin", "users", "world", "economy", "plugins", "security"];

const formatTime = (ts: string | number | undefined): string => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
};

export default function SecuritySection(props: any) {
  const [tokenName, setTokenName] = useState("");
  const [tokenPerms, setTokenPerms] = useState<Record<string, boolean>>({});

  const auditLogs: any[] = props?.auditLogs ?? [];
  const securityInfo: any = props?.securityInfo ?? {};
  const activeSessions: any[] = securityInfo.activeSessions ?? [];
  const apiTokens: any[] = securityInfo.apiTokens ?? [];
  const failedLogins: any = securityInfo.failedLogins ?? {};
  const securityFlags: any = securityInfo.flags ?? securityInfo.securityFlags ?? {};
  const rateLimit: any = securityInfo.rateLimit ?? {};

  const refresh = useCallback(() => {
    if (props?.refreshSecurity) props.refreshSecurity();
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRevoke = async (tokenId: string) => {
    if (props?.revokeToken) await props.revokeToken(tokenId);
    refresh();
  };

  const handleCreateToken = async () => {
    if (!tokenName) return;
    const perms = PERMS.filter((p) => tokenPerms[p]);
    if (props?.createToken) await props.createToken(tokenName, perms);
    setTokenName("");
    setTokenPerms({});
    refresh();
  };

  const togglePerm = (p: string) => {
    setTokenPerms((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  const failedCount = failedLogins.count ?? failedLogins.total ?? 0;
  const failedMax = failedLogins.max ?? 10;
  const rateUsage = rateLimit.current ?? rateLimit.used ?? 0;
  const rateMax = rateLimit.max ?? rateLimit.limit ?? 100;
  const ratePct = rateMax > 0 ? Math.min(100, (rateUsage / rateMax) * 100) : 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Security Management</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Failed Logins</div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Failed Attempts</span>
            <span style={styles.statValue}>{failedCount} / {failedMax}</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${failedMax > 0 ? Math.min(100, (failedCount / failedMax) * 100) : 0}%`, backgroundColor: failedCount > failedMax * 0.8 ? "#ef4444" : "#f59e0b" }} />
          </div>
          {failedLogins.lastAttempt && (
            <div style={{ ...styles.statRow, marginTop: "8px" }}>
              <span style={styles.statLabel}>Last Attempt</span>
              <span style={styles.statValue}>{formatTime(failedLogins.lastAttempt)}</span>
            </div>
          )}
          {failedLogins.lockedUntil && (
            <div style={{ marginTop: "8px" }}>
              <span style={{ ...styles.badge, ...styles.badgeWarn }}>Locked until {formatTime(failedLogins.lockedUntil)}</span>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Rate Limit Status</div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Current Usage</span>
            <span style={styles.statValue}>{rateUsage} / {rateMax} req/min</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${ratePct}%`, backgroundColor: ratePct > 80 ? "#ef4444" : ratePct > 50 ? "#f59e0b" : "#10b981" }} />
          </div>
          {rateLimit.window && (
            <div style={{ ...styles.statRow, marginTop: "8px" }}>
              <span style={styles.statLabel}>Window</span>
              <span style={styles.statValue}>{rateLimit.window}</span>
            </div>
          )}
        </div>

        <div style={{ ...styles.card, ...styles.fullCard }}>
          <div style={styles.cardTitle}>Security Flags</div>
          {[
            { key: "csrf", label: "CSRF Protection" },
            { key: "cors", label: "CORS Enabled" },
            { key: "inputValidation", label: "Input Validation" },
            { key: "sqlInjection", label: "SQL Injection Protection" },
            { key: "xss", label: "XSS Protection" },
          ].map((flag) => {
            const on = !!securityFlags[flag.key];
            return (
              <div key={flag.key} style={styles.flagRow}>
                <span style={styles.flagLabel}>{flag.label}</span>
                <div style={styles.flagIndicator}>
                  <span style={{ ...styles.flagDot, ...(on ? styles.flagOn : styles.flagOff) }} />
                  {on ? "Enabled" : "Disabled"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...styles.card, ...styles.fullCard }}>
          <div style={styles.cardTitle}>Active Sessions</div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Started</th>
                  <th style={styles.th}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.length === 0 && (
                  <tr><td colSpan={4} style={styles.empty}>No active sessions.</td></tr>
                )}
                {activeSessions.map((s: any, i: number) => (
                  <tr key={i}>
                    <td style={styles.td}>{s.email ?? s.user ?? "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{s.ip ?? "—"}</td>
                    <td style={styles.td}>{formatTime(s.startedAt ?? s.created_at)}</td>
                    <td style={styles.td}>{formatTime(s.lastActive ?? s.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.fullCard }}>
          <div style={styles.cardTitle}>API Tokens</div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Token</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Last Used</th>
                  <th style={styles.th}>Permissions</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiTokens.length === 0 && (
                  <tr><td colSpan={7} style={styles.empty}>No API tokens.</td></tr>
                )}
                {apiTokens.map((t: any, i: number) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.name ?? "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{t.token ? `${t.token.slice(0, 8)}...` : "—"}</td>
                    <td style={styles.td}>{formatTime(t.createdAt ?? t.created_at)}</td>
                    <td style={styles.td}>{formatTime(t.lastUsed ?? t.last_used)}</td>
                    <td style={styles.td}>{(t.permissions ?? []).join(", ") || "—"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(t.active ? styles.badgeActive : styles.badgeRevoked) }}>
                        {t.active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => handleRevoke(t.id ?? t.name)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div style={styles.cardTitle}>Create New Token</div>
            <input
              style={styles.input}
              placeholder="Token name..."
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
            <div style={styles.permGroup}>
              {PERMS.map((p) => (
                <label key={p} style={{ ...styles.permLabel, ...(tokenPerms[p] ? styles.permLabelActive : {}) }}>
                  <input type="checkbox" checked={!!tokenPerms[p]} onChange={() => togglePerm(p)} />
                  {p}
                </label>
              ))}
            </div>
            <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleCreateToken}>
              Create Token
            </button>
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.fullCard }}>
          <div style={styles.cardTitle}>Audit Log</div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Actor</th>
                  <th style={styles.th}>Target Type</th>
                  <th style={styles.th}>Target ID</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr><td colSpan={6} style={styles.empty}>No audit logs.</td></tr>
                )}
                {auditLogs.map((log: any, i: number) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, ...styles.mono }}>{formatTime(log.timestamp ?? log.created_at)}</td>
                    <td style={styles.td}>{log.action ?? "—"}</td>
                    <td style={styles.td}>{log.actorEmail ?? log.actor_email ?? log.actor ?? "—"}</td>
                    <td style={styles.td}>{log.targetType ?? log.target_type ?? "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{log.targetId ?? log.target_id ?? "—"}</td>
                    <td style={{ ...styles.td, ...styles.mono }}>{log.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
