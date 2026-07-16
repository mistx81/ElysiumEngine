import { useEffect, useState, useCallback, useRef } from "react";

const styles: Record<string, any> = {
  container: {
    padding: "24px",
    backgroundColor: "#0a0e17",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: { fontSize: "24px", fontWeight: 700, margin: "0 0 20px 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", marginBottom: "20px" },
  card: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "20px",
  },
  cardTitle: { fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" },
  toolbar: { display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  input: {
    padding: "8px 12px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "240px",
  },
  btn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #2a3548",
    backgroundColor: "#151c2c",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  btnAccent: { borderColor: "#3b82f6", color: "#3b82f6" },
  btnSuccess: { borderColor: "#10b981", color: "#10b981" },
  btnWarn: { borderColor: "#f59e0b", color: "#f59e0b" },
  tableWrap: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#94a3b8",
    borderBottom: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
  },
  td: { padding: "12px 14px", fontSize: "14px", borderBottom: "1px solid #2a3548" },
  statRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px" },
  statLabel: { color: "#94a3b8" },
  statValue: { fontWeight: 600 },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#0a0e17",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  progressFill: { height: "100%", backgroundColor: "#3b82f6", borderRadius: "4px" },
  backupItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #2a3548",
    fontSize: "14px",
  },
  backupInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  backupName: { fontWeight: 500 },
  backupMeta: { fontSize: "12px", color: "#94a3b8" },
  backupActions: { display: "flex", gap: "8px" },
  empty: { textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "14px" },
  confirmOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  confirmBox: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "24px",
    minWidth: "360px",
  },
  confirmText: { marginBottom: "20px", fontSize: "15px" },
  confirmActions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
};

const formatSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

export default function DatabaseSection(props: any) {
  const [search, setSearch] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tableInfo: any[] = props?.tableInfo ?? [];
  const backups: any[] = props?.backups ?? [];

  const refresh = useCallback(() => {
    if (props?.refreshTableInfo) props.refreshTableInfo();
    if (props?.refreshBackups) props.refreshBackups();
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTables = tableInfo.filter((t: any) => {
    if (!search) return true;
    return (t.name ?? t.table_name ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const totalSize = tableInfo.reduce((sum: number, t: any) => sum + (t.size ?? t.total_size ?? 0), 0);
  const totalRows = tableInfo.reduce((sum: number, t: any) => sum + (t.row_count ?? t.rows ?? 0), 0);
  const sortedBySize = [...tableInfo].sort((a, b) => (b.size ?? b.total_size ?? 0) - (a.size ?? a.total_size ?? 0));
  const biggestTable = sortedBySize[0];

  const handleCreateBackup = async () => {
    if (props?.createBackup) await props.createBackup();
    refresh();
  };

  const handleRestore = async () => {
    if (confirmRestore && props?.restoreBackup) {
      await props.restoreBackup(confirmRestore.id ?? confirmRestore.name);
    }
    setConfirmRestore(null);
    refresh();
  };

  const handleExport = () => {
    if (props?.exportDatabase) props.exportDatabase();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && props?.importDatabase) {
      props.importDatabase(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Database Management</h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Tables</div>
          <div style={styles.toolbar}>
            <input
              style={styles.input}
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Table Name</th>
                  <th style={styles.th}>Rows</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Indexes</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.length === 0 && (
                  <tr>
                    <td colSpan={4} style={styles.empty}>No tables found.</td>
                  </tr>
                )}
                {filteredTables.map((t: any, i: number) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.name ?? t.table_name ?? "—"}</td>
                    <td style={styles.td}>{(t.row_count ?? t.rows ?? 0).toLocaleString()}</td>
                    <td style={styles.td}>{formatSize(t.size ?? t.total_size)}</td>
                    <td style={styles.td}>{t.index_count ?? t.indexes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Storage Usage</div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Total Size</span>
              <span style={styles.statValue}>{formatSize(totalSize)}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Total Rows</span>
              <span style={styles.statValue}>{totalRows.toLocaleString()}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Tables</span>
              <span style={styles.statValue}>{tableInfo.length}</span>
            </div>
            {biggestTable && (
              <>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Largest Table</span>
                  <span style={styles.statValue}>{biggestTable.name ?? biggestTable.table_name}</span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${totalSize > 0 ? ((biggestTable.size ?? biggestTable.total_size ?? 0) / totalSize) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                  {formatSize(biggestTable.size ?? biggestTable.total_size)}
                </div>
              </>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Backups</div>
            {backups.length === 0 && <div style={styles.empty}>No backups available.</div>}
            {backups.map((b: any, i: number) => (
              <div key={i} style={styles.backupItem}>
                <div style={styles.backupInfo}>
                  <span style={styles.backupName}>{b.name ?? b.filename ?? `backup-${i}`}</span>
                  <span style={styles.backupMeta}>
                    {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
                    {b.size ? ` · ${formatSize(b.size)}` : ""}
                  </span>
                </div>
                <div style={styles.backupActions}>
                  <button
                    style={{ ...styles.btn, ...styles.btnWarn }}
                    onClick={() => setConfirmRestore(b)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleCreateBackup}>
                Create Backup
              </button>
              <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={handleExport}>
                Export DB
              </button>
              <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={() => fileInputRef.current?.click()}>
                Import DB
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.sql,.dump"
                style={{ display: "none" }}
                onChange={handleImportFile}
              />
            </div>
          </div>
        </div>
      </div>

      {confirmRestore && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmRestore(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmText}>
              Restore database from backup <strong>{confirmRestore.name ?? confirmRestore.filename}</strong>? Current data will be overwritten.
            </div>
            <div style={styles.confirmActions}>
              <button style={styles.btn} onClick={() => setConfirmRestore(null)}>Cancel</button>
              <button style={{ ...styles.btn, ...styles.btnWarn }} onClick={handleRestore}>Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
