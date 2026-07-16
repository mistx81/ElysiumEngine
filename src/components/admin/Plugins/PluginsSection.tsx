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
  card: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "16px",
  },
  cardTitle: { fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0" },
  pluginHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  pluginName: { fontSize: "16px", fontWeight: 600, margin: 0 },
  pluginMeta: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
  pluginDesc: { fontSize: "14px", color: "#94a3b8", marginBottom: "12px" },
  badge: { padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, display: "inline-block" },
  badgeEnabled: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  badgeDisabled: { backgroundColor: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  badgeError: { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" },
  chipGroup: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" },
  chipLabel: { fontSize: "12px", color: "#94a3b8", fontWeight: 600, minWidth: "90px" },
  chip: {
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    color: "#e2e8f0",
  },
  chipPerm: { borderColor: "#f59e0b", color: "#f59e0b" },
  hooksRow: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px", alignItems: "center" },
  hookItem: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" },
  hookDot: { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" },
  hookActive: { backgroundColor: "#10b981" },
  hookInactive: { backgroundColor: "#2a3548" },
  hookError: { backgroundColor: "#ef4444" },
  actions: { display: "flex", gap: "8px", marginTop: "12px" },
  btn: {
    padding: "6px 12px",
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
  btnDanger: { borderColor: "#ef4444", color: "#ef4444" },
  btnWarn: { borderColor: "#f59e0b", color: "#f59e0b" },
  installRow: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" },
  input: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    minWidth: "300px",
  },
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

const statusBadge = (status: string): Record<string, any> => {
  const map: Record<string, any> = {
    enabled: styles.badgeEnabled,
    disabled: styles.badgeDisabled,
    error: styles.badgeError,
  };
  return map[status] ?? styles.badgeDisabled;
};

const hookStyle = (status: string): Record<string, any> => {
  if (status === "active" || status === "loaded" || status === "true") return styles.hookActive;
  if (status === "error") return styles.hookError;
  return styles.hookInactive;
};

export default function PluginsSection(props: any) {
  const [installUrl, setInstallUrl] = useState("");
  const [confirmUninstall, setConfirmUninstall] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plugins: any[] = props?.plugins ?? [];

  const refresh = useCallback(() => {
    if (props?.refreshPlugins) props.refreshPlugins();
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggle = async (plugin: any) => {
    if (plugin.status === "enabled" && props?.disablePlugin) {
      await props.disablePlugin(plugin.id ?? plugin.name);
    } else if (props?.enablePlugin) {
      await props.enablePlugin(plugin.id ?? plugin.name);
    }
    refresh();
  };

  const handleReload = async (plugin: any) => {
    if (props?.reloadPlugin) await props.reloadPlugin(plugin.id ?? plugin.name);
    refresh();
  };

  const handleInstall = async () => {
    if (installUrl && props?.installPlugin) {
      await props.installPlugin(installUrl);
      setInstallUrl("");
    }
    refresh();
  };

  const handleInstallFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && props?.installPlugin) {
      props.installPlugin(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    refresh();
  };

  const handleUninstall = async () => {
    if (confirmUninstall && props?.uninstallPlugin) {
      await props.uninstallPlugin(confirmUninstall.id ?? confirmUninstall.name);
    }
    setConfirmUninstall(null);
    refresh();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Plugin Management</h1>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Install Plugin</div>
        <div style={styles.installRow}>
          <input
            style={styles.input}
            placeholder="https://example.com/plugin.tar.gz"
            value={installUrl}
            onChange={(e) => setInstallUrl(e.target.value)}
          />
          <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleInstall}>
            Install from URL
          </button>
          <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={() => fileInputRef.current?.click()}>
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tar.gz,.zip,.js"
            style={{ display: "none" }}
            onChange={handleInstallFile}
          />
        </div>
      </div>

      {plugins.length === 0 && (
        <div style={styles.card}>
          <div style={styles.empty}>No plugins installed.</div>
        </div>
      )}

      {plugins.map((plugin: any, i: number) => {
        const status = plugin.status ?? "disabled";
        const hooks = plugin.hooks ?? {};
        return (
          <div key={i} style={styles.card}>
            <div style={styles.pluginHeader}>
              <div>
                <h3 style={styles.pluginName}>{plugin.name ?? "Unknown"}</h3>
                <div style={styles.pluginMeta}>
                  v{plugin.version ?? "0.0.0"} · by {plugin.author ?? "Unknown"}
                </div>
              </div>
              <span style={{ ...styles.badge, ...statusBadge(status) }}>{status.toUpperCase()}</span>
            </div>

            {plugin.description && (
              <div style={styles.pluginDesc}>{plugin.description}</div>
            )}

            <div style={styles.chipGroup}>
              <span style={styles.chipLabel}>Dependencies:</span>
              {(plugin.dependencies ?? []).length === 0 && <span style={styles.chip}>none</span>}
              {(plugin.dependencies ?? []).map((dep: string, j: number) => (
                <span key={j} style={styles.chip}>{dep}</span>
              ))}
            </div>

            <div style={styles.chipGroup}>
              <span style={styles.chipLabel}>Permissions:</span>
              {(plugin.permissions ?? []).length === 0 && <span style={styles.chip}>none</span>}
              {(plugin.permissions ?? []).map((perm: string, j: number) => (
                <span key={j} style={{ ...styles.chip, ...styles.chipPerm }}>{perm}</span>
              ))}
            </div>

            <div style={styles.hooksRow}>
              <span style={styles.chipLabel}>Lifecycle Hooks:</span>
              {["onLoad", "onTick", "onUnload"].map((hook) => (
                <div key={hook} style={styles.hookItem}>
                  <span style={{ ...styles.hookDot, ...hookStyle(hooks[hook]) }} />
                  {hook}
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button
                style={{ ...styles.btn, ...(status === "enabled" ? styles.btnWarn : styles.btnSuccess) }}
                onClick={() => handleToggle(plugin)}
              >
                {status === "enabled" ? "Disable" : "Enable"}
              </button>
              <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={() => handleReload(plugin)}>
                Reload
              </button>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={() => setConfirmUninstall(plugin)}>
                Uninstall
              </button>
            </div>
          </div>
        );
      })}

      {confirmUninstall && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmUninstall(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmText}>
              Uninstall plugin <strong>{confirmUninstall.name}</strong>? This action cannot be undone.
            </div>
            <div style={styles.confirmActions}>
              <button style={styles.btn} onClick={() => setConfirmUninstall(null)}>Cancel</button>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={handleUninstall}>Uninstall</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
