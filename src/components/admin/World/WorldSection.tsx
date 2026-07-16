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
  grid: {
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
  stateRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #2a3548",
    fontSize: "14px",
  },
  stateRowLast: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    fontSize: "14px",
  },
  stateLabel: { color: "#94a3b8" },
  stateValue: { fontWeight: 600, fontSize: "16px" },
  eventList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  },
  eventItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    backgroundColor: "#0a0e17",
    borderRadius: "6px",
    fontSize: "13px",
  },
  eventType: { fontWeight: 600, color: "#06b6d4" },
  eventDesc: { color: "#94a3b8", fontSize: "12px" },
  empty: { color: "#64748b", fontSize: "13px", textAlign: "center", padding: "16px" },
  controls: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" },
  input: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    width: "120px",
  },
  select: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    cursor: "pointer",
    width: "180px",
  },
  btn: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: { backgroundColor: "#3b82f6" },
  btnWarn: { backgroundColor: "#f59e0b" },
  btnSuccess: { backgroundColor: "#10b981" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnInfo: { backgroundColor: "#06b6d4" },
  factsList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "240px",
    overflowY: "auto",
  },
  factItem: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    borderRadius: "6px",
    fontSize: "13px",
    borderLeft: "3px solid #06b6d4",
  },
  fullRow: { gridColumn: "1 / -1" },
  divider: {
    height: "1px",
    backgroundColor: "#2a3548",
    margin: "14px 0",
  },
};

const seasonEmoji = (season: string): string => {
  const map: Record<string, string> = {
    spring: "🌸",
    summer: "☀️",
    autumn: "🍂",
    fall: "🍂",
    winter: "❄️",
  };
  return map[(season ?? "").toLowerCase()] ?? "🌍";
};

const weatherEmoji = (weather: string): string => {
  const map: Record<string, string> = {
    sunny: "☀️",
    clear: "🌤️",
    cloudy: "☁️",
    rainy: "🌧️",
    rain: "🌧️",
    stormy: "⛈️",
    storm: "⛈️",
    snowy: "🌨️",
    snow: "🌨️",
    foggy: "🌫️",
    fog: "🌫️",
    windy: "💨",
  };
  return map[(weather ?? "").toLowerCase()] ?? "🌡️";
};

const EVENT_TYPES = [
  "disaster",
  "festival",
  "war",
  "economy_crash",
  "trade_boom",
  "plague",
  "weather_change",
];

export default function WorldSection(props: any) {
  const [ffTicks, setFfTicks] = useState("");
  const [selectedEventType, setSelectedEventType] = useState(EVENT_TYPES[0]);

  const world = props?.world ?? {};
  const simRunning = world.simulationRunning ?? props?.simulationRunning ?? false;
  const activeEvents: any[] = world.activeEvents ?? props?.activeEvents ?? [];
  const worldFacts: any[] = world.facts ?? props?.worldFacts ?? [];

  const refresh = useCallback(async () => {
    if (props?.refreshWorld) await props.refreshWorld();
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTogglePause = async () => {
    if (simRunning) {
      if (props?.pauseSim) await props.pauseSim();
    } else {
      if (props?.resumeSim) await props.resumeSim();
    }
    refresh();
  };

  const handleFastForward = async () => {
    const ticks = parseInt(ffTicks, 10);
    if (isNaN(ticks) || ticks <= 0) return;
    if (props?.fastForward) await props.fastForward(ticks);
    setFfTicks("");
    refresh();
  };

  const handleSpawnEvent = async () => {
    if (!selectedEventType) return;
    if (props?.spawnEvent) await props.spawnEvent(selectedEventType);
    refresh();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>World Control Panel</h1>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Current State</div>
          <div style={styles.stateRow}>
            <span style={styles.stateLabel}>Day</span>
            <span style={styles.stateValue}>{world.day ?? "—"}</span>
          </div>
          <div style={styles.stateRow}>
            <span style={styles.stateLabel}>Hour</span>
            <span style={styles.stateValue}>{world.hour ?? "—"}</span>
          </div>
          <div style={styles.stateRow}>
            <span style={styles.stateLabel}>Season</span>
            <span style={styles.stateValue}>
              {seasonEmoji(world.season)} {world.season ?? "—"}
            </span>
          </div>
          <div style={styles.stateRowLast}>
            <span style={styles.stateLabel}>Weather</span>
            <span style={styles.stateValue}>
              {weatherEmoji(world.weather)} {world.weather ?? "—"}
            </span>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Active Events</div>
          {activeEvents.length === 0 ? (
            <div style={styles.empty}>No active events</div>
          ) : (
            <div style={styles.eventList}>
              {activeEvents.map((ev: any, idx: number) => (
                <div key={ev?.id ?? idx} style={styles.eventItem}>
                  <div>
                    <div style={styles.eventType}>{ev?.type ?? ev?.eventType ?? "event"}</div>
                    {ev?.description && (
                      <div style={styles.eventDesc}>{ev.description}</div>
                    )}
                  </div>
                  <span style={{ color: "#f59e0b", fontSize: "12px" }}>
                    {ev?.day ?? ev?.startDay ?? ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Simulation Controls</div>
          <div style={styles.controls}>
            <button
              style={{
                ...styles.btn,
                ...(simRunning ? styles.btnWarn : styles.btnSuccess),
              }}
              onClick={handleTogglePause}
            >
              {simRunning ? "⏸ Pause" : "▶ Resume"}
            </button>
          </div>
          <div style={styles.divider} />
          <div style={styles.controls}>
            <div style={styles.fieldGroup}>
              <span style={styles.label}>Fast Forward Ticks</span>
              <input
                style={styles.input}
                type="number"
                placeholder="100"
                value={ffTicks}
                onChange={(e) => setFfTicks(e.target.value)}
              />
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnInfo }}
              onClick={handleFastForward}
            >
              ⏩ Fast Forward
            </button>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Spawn Event</div>
          <div style={styles.controls}>
            <div style={styles.fieldGroup}>
              <span style={styles.label}>Event Type</span>
              <select
                style={styles.select}
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnDanger }}
              onClick={handleSpawnEvent}
            >
              ⚡ Spawn Event
            </button>
          </div>
        </div>

        <div style={{ ...styles.panel, ...styles.fullRow }}>
          <div style={styles.panelTitle}>World Facts</div>
          {worldFacts.length === 0 ? (
            <div style={styles.empty}>No world facts recorded</div>
          ) : (
            <div style={styles.factsList}>
              {worldFacts.map((fact: any, idx: number) => (
                <div key={fact?.id ?? idx} style={styles.factItem}>
                  {typeof fact === "string" ? fact : fact?.text ?? fact?.description ?? JSON.stringify(fact)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
