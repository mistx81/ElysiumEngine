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
  tabs: { display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" },
  tab: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #2a3548",
    backgroundColor: "#151c2c",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  tabActive: { backgroundColor: "#3b82f6", color: "#0a0e17", borderColor: "#3b82f6" },
  card: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "24px",
    maxWidth: "700px",
  },
  field: { marginBottom: "20px" },
  label: { display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" },
  hint: { fontSize: "12px", color: "#94a3b8", marginBottom: "6px" },
  input: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  select: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
  },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  toggle: {
    position: "relative",
    width: "44px",
    height: "24px",
    backgroundColor: "#2a3548",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    flexShrink: 0,
  },
  toggleOn: { backgroundColor: "#10b981" },
  toggleKnob: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "18px",
    height: "18px",
    backgroundColor: "#e2e8f0",
    borderRadius: "50%",
    transition: "transform 0.2s",
  },
  toggleKnobOn: { transform: "translateX(20px)" },
  themeRow: { display: "flex", gap: "10px", marginTop: "10px" },
  themeSwatch: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "2px solid transparent",
  },
  themeSelected: { border: "2px solid #3b82f6" },
  saveRow: { display: "flex", gap: "10px", marginTop: "20px" },
  btn: {
    padding: "8px 18px",
    borderRadius: "6px",
    border: "1px solid #2a3548",
    backgroundColor: "#151c2c",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  btnSuccess: { borderColor: "#10b981", color: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" },
  savedMsg: { fontSize: "13px", color: "#10b981", alignSelf: "center" },
};

const TABS = [
  { id: "world", label: "World" },
  { id: "runtime", label: "Runtime" },
  { id: "performance", label: "Performance" },
  { id: "auth", label: "Auth" },
  { id: "storage", label: "Storage" },
  { id: "security", label: "Security" },
];

const THEMES = [
  { id: "dark", label: "Dark", color: "#0a0e17" },
  { id: "midnight", label: "Midnight", color: "#0f172a" },
  { id: "carbon", label: "Carbon", color: "#1a1a1a" },
  { id: "obsidian", label: "Obsidian", color: "#0d0d0d" },
];

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <div style={{ ...styles.toggle, ...(on ? styles.toggleOn : {}) }} onClick={onClick}>
    <div style={{ ...styles.toggleKnob, ...(on ? styles.toggleKnobOn : {}) }} />
  </div>
);

export default function SettingsSection(props: any) {
  const [activeTab, setActiveTab] = useState("world");
  const [form, setForm] = useState<Record<string, any>>(props?.settings ?? {});
  const [theme, setTheme] = useState<string>(form?.theme ?? "dark");
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(() => {
    if (props?.refreshSettings) props.refreshSettings();
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (props?.settings) setForm(props.settings);
  }, [props?.settings]);

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const payload = { ...form, theme };
    if (props?.saveSettings) await props.saveSettings(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderField = (key: string, label: string, hint?: string, type: string = "text") => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {hint && <div style={styles.hint}>{hint}</div>}
      <input
        style={styles.input}
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => update(key, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );

  const renderToggle = (key: string, label: string, hint?: string) => (
    <div style={styles.field}>
      <div style={styles.toggleRow}>
        <div>
          <label style={styles.label}>{label}</label>
          {hint && <div style={styles.hint}>{hint}</div>}
        </div>
        <Toggle on={!!form[key]} onClick={() => update(key, !form[key])} />
      </div>
    </div>
  );

  const renderSelect = (key: string, label: string, options: string[], hint?: string) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {hint && <div style={styles.hint}>{hint}</div>}
      <select style={styles.select} value={form[key] ?? ""} onChange={(e) => update(key, e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings Management</h1>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {activeTab === "world" && (
          <>
            {renderField("timeScale", "Time Scale", "Multiplier for simulation speed", "number")}
            {renderField("autoSaveInterval", "Auto-Save Interval (seconds)", "How often to auto-save world state", "number")}
            {renderField("maxNPCs", "Max NPCs", "Maximum number of NPCs in the world", "number")}
            {renderField("seasonLength", "Season Length (days)", "Duration of each season", "number")}
          </>
        )}

        {activeTab === "runtime" && (
          <>
            {renderField("tickInterval", "Tick Interval (ms)", "Simulation tick frequency", "number")}
            {renderField("backgroundInterval", "Background Interval (ms)", "Background task frequency", "number")}
            {renderField("maxEvents", "Max Events", "Maximum queued events", "number")}
            {renderToggle("enableReplay", "Enable Replay", "Allow session replay recording")}
          </>
        )}

        {activeTab === "performance" && (
          <>
            {renderToggle("lodEnabled", "LOD Enabled", "Enable level-of-detail optimization")}
            {renderToggle("chunkingEnabled", "Chunking Enabled", "Enable spatial chunking")}
            {renderField("cacheMaxEntries", "Cache Max Entries", "Maximum cache size", "number")}
            {renderField("batchWriteInterval", "Batch Write Interval (ms)", "Database batch write frequency", "number")}
            {renderField("schedulerBudget", "Scheduler Budget (ms)", "Max time per tick for scheduler", "number")}
          </>
        )}

        {activeTab === "auth" && (
          <>
            {renderToggle("allowRegistration", "Allow Registration", "Allow new user sign-ups")}
            {renderField("sessionTimeout", "Session Timeout (minutes)", "Session expiration time", "number")}
            {renderField("maxLoginAttempts", "Max Login Attempts", "Before account lockout", "number")}
          </>
        )}

        {activeTab === "storage" && (
          <>
            {renderField("maxBackups", "Max Backups", "Maximum backup files to retain", "number")}
            {renderToggle("compressionEnabled", "Compression Enabled", "Compress backup files")}
            {renderSelect("exportFormat", "Export Format", ["json", "sql", "csv"], "Default export format")}
          </>
        )}

        {activeTab === "security" && (
          <>
            {renderField("rateLimit", "Rate Limit (req/min)", "Requests per minute per IP", "number")}
            {renderToggle("csrfEnabled", "CSRF Protection", "Enable CSRF tokens")}
            {renderField("corsOrigins", "CORS Origins", "Comma-separated allowed origins")}
            {renderToggle("inputValidation", "Input Validation", "Validate all user inputs")}
            {renderToggle("sqlInjectionProtection", "SQL Injection Protection", "Parameterized queries enforcement")}
            {renderToggle("xssProtection", "XSS Protection", "Sanitize user-generated content")}
          </>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Theme</label>
          <div style={styles.themeRow}>
            {THEMES.map((t) => (
              <div
                key={t.id}
                title={t.label}
                style={{
                  ...styles.themeSwatch,
                  backgroundColor: t.color,
                  ...(theme === t.id ? styles.themeSelected : {}),
                }}
                onClick={() => { setTheme(t.id); setSaved(false); }}
              />
            ))}
          </div>
        </div>

        <div style={styles.saveRow}>
          <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleSave}>
            Save Settings
          </button>
          {saved && <span style={styles.savedMsg}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
