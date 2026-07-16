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
  spawnBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    alignItems: "flex-end",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" },
  input: {
    padding: "8px 12px",
    backgroundColor: "#0a0e17",
    border: "1px solid #2a3548",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    width: "180px",
  },
  btn: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSuccess: { backgroundColor: "#10b981" },
  btnWarn: { backgroundColor: "#f59e0b" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnInfo: { backgroundColor: "#06b6d4" },
  btnSm: { padding: "4px 10px", fontSize: "12px", borderRadius: "5px" },
  tableWrap: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    overflowX: "auto",
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
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    fontSize: "13px",
    borderBottom: "1px solid #2a3548",
    whiteSpace: "nowrap",
  },
  badge: {
    padding: "3px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
  },
  badgeAlive: { backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981" },
  badgeDead: { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" },
  badgeFrozen: { backgroundColor: "rgba(6,182,212,0.15)", color: "#06b6d4" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  actionBtn: {
    padding: "4px 10px",
    borderRadius: "5px",
    border: "1px solid #2a3548",
    backgroundColor: "#0a0e17",
    color: "#e2e8f0",
    fontSize: "12px",
    cursor: "pointer",
  },
  loading: { textAlign: "center", padding: "40px", color: "#94a3b8" },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalBox: {
    backgroundColor: "#151c2c",
    border: "1px solid #2a3548",
    borderRadius: "10px",
    padding: "24px",
    minWidth: "340px",
  },
  modalTitle: { fontSize: "18px", fontWeight: 700, marginBottom: "16px" },
  modalRow: { display: "flex", gap: "12px", marginBottom: "16px" },
  modalActions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
};

export default function NPCsSection(props: any) {
  const [loading, setLoading] = useState(false);
  const [spawnName, setSpawnName] = useState("");
  const [spawnAge, setSpawnAge] = useState("");
  const [teleportTarget, setTeleportTarget] = useState<any>(null);
  const [teleportX, setTeleportX] = useState("");
  const [teleportY, setTeleportY] = useState("");

  const npcs: any[] = props?.npcSummaries ?? [];

  const refresh = useCallback(async () => {
    if (props?.refreshNPCs) {
      setLoading(true);
      try {
        await props.refreshNPCs();
      } finally {
        setLoading(false);
      }
    }
  }, [props]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSpawn = async () => {
    if (!spawnName.trim()) return;
    const age = parseInt(spawnAge, 10);
    if (props?.spawnNewNPC) {
      await props.spawnNewNPC(spawnName.trim(), isNaN(age) ? 25 : age);
      setSpawnName("");
      setSpawnAge("");
      refresh();
    }
  };

  const handleKill = async (id: string) => {
    if (props?.killNPCById) await props.killNPCById(id);
    refresh();
  };

  const handleRespawn = async (id: string) => {
    if (props?.respawnNPCById) await props.respawnNPCById(id);
    refresh();
  };

  const handleFreeze = async (id: string) => {
    if (props?.freezeNPCById) await props.freezeNPCById(id);
    refresh();
  };

  const handleResume = async (id: string) => {
    if (props?.resumeNPCById) await props.resumeNPCById(id);
    refresh();
  };

  const openTeleport = (npc: any) => {
    setTeleportTarget(npc);
    setTeleportX(String(npc.x ?? npc.position?.x ?? ""));
    setTeleportY(String(npc.y ?? npc.position?.y ?? ""));
  };

  const handleTeleport = async () => {
    if (!teleportTarget) return;
    const x = parseFloat(teleportX);
    const y = parseFloat(teleportY);
    if (isNaN(x) || isNaN(y)) return;
    if (props?.teleportNPCById) await props.teleportNPCById(teleportTarget.id, x, y);
    setTeleportTarget(null);
    refresh();
  };

  const fmtRel = (rels: any): string => {
    if (!rels) return "0";
    if (Array.isArray(rels)) return String(rels.length);
    if (typeof rels === "number") return String(rels);
    if (typeof rels === "object") return String(Object.keys(rels).length);
    return String(rels);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>NPC Management</h1>

      <div style={styles.spawnBar}>
        <div style={styles.fieldGroup}>
          <span style={styles.label}>Name</span>
          <input
            style={styles.input}
            placeholder="NPC name..."
            value={spawnName}
            onChange={(e) => setSpawnName(e.target.value)}
          />
        </div>
        <div style={styles.fieldGroup}>
          <span style={styles.label}>Age</span>
          <input
            style={styles.input}
            type="number"
            placeholder="25"
            value={spawnAge}
            onChange={(e) => setSpawnAge(e.target.value)}
          />
        </div>
        <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={handleSpawn}>
          + Spawn NPC
        </button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Age</th>
              <th style={styles.th}>Alive</th>
              <th style={styles.th}>Mood</th>
              <th style={styles.th}>Current Action</th>
              <th style={styles.th}>Current Goal</th>
              <th style={styles.th}>Memories</th>
              <th style={styles.th}>Relationships</th>
              <th style={styles.th}>Wallet</th>
              <th style={styles.th}>LOD</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={11} style={styles.loading}>
                  Loading NPCs...
                </td>
              </tr>
            )}
            {!loading && npcs.length === 0 && (
              <tr>
                <td colSpan={11} style={styles.loading}>
                  No NPCs found.
                </td>
              </tr>
            )}
            {!loading &&
              npcs.map((npc: any) => {
                const alive = npc.alive !== false;
                const frozen = npc.frozen === true;
                return (
                  <tr key={npc.id}>
                    <td style={styles.td}>{npc.name ?? "—"}</td>
                    <td style={styles.td}>{npc.age ?? "—"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(frozen
                            ? styles.badgeFrozen
                            : alive
                            ? styles.badgeAlive
                            : styles.badgeDead),
                        }}
                      >
                        {frozen ? "Frozen" : alive ? "Alive" : "Dead"}
                      </span>
                    </td>
                    <td style={styles.td}>{npc.mood ?? "—"}</td>
                    <td style={styles.td}>{npc.currentAction ?? npc.current_action ?? "—"}</td>
                    <td style={styles.td}>{npc.currentGoal ?? npc.current_goal ?? "—"}</td>
                    <td style={styles.td}>{npc.memoryCount ?? npc.memory_count ?? 0}</td>
                    <td style={styles.td}>{fmtRel(npc.relationships)}</td>
                    <td style={styles.td}>{npc.wallet ?? 0}</td>
                    <td style={styles.td}>{npc.lodLevel ?? npc.lod_level ?? "—"}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {alive ? (
                          <button
                            style={{ ...styles.actionBtn, ...styles.btnDanger, borderColor: "#ef4444", color: "#ef4444" }}
                            onClick={() => handleKill(npc.id)}
                          >
                            Kill
                          </button>
                        ) : (
                          <button
                            style={{ ...styles.actionBtn, ...styles.btnSuccess, borderColor: "#10b981", color: "#10b981" }}
                            onClick={() => handleRespawn(npc.id)}
                          >
                            Respawn
                          </button>
                        )}
                        {frozen ? (
                          <button
                            style={{ ...styles.actionBtn, ...styles.btnSuccess, borderColor: "#10b981", color: "#10b981" }}
                            onClick={() => handleResume(npc.id)}
                          >
                            Resume
                          </button>
                        ) : (
                          <button
                            style={{ ...styles.actionBtn, ...styles.btnInfo, borderColor: "#06b6d4", color: "#06b6d4" }}
                            onClick={() => handleFreeze(npc.id)}
                          >
                            Freeze
                          </button>
                        )}
                        <button
                          style={styles.actionBtn}
                          onClick={() => openTeleport(npc)}
                        >
                          Teleport
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {teleportTarget && (
        <div style={styles.modalOverlay} onClick={() => setTeleportTarget(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              Teleport {teleportTarget.name ?? "NPC"}
            </div>
            <div style={styles.modalRow}>
              <div style={styles.fieldGroup}>
                <span style={styles.label}>X Coordinate</span>
                <input
                  style={styles.input}
                  type="number"
                  value={teleportX}
                  onChange={(e) => setTeleportX(e.target.value)}
                />
              </div>
              <div style={styles.fieldGroup}>
                <span style={styles.label}>Y Coordinate</span>
                <input
                  style={styles.input}
                  type="number"
                  value={teleportY}
                  onChange={(e) => setTeleportY(e.target.value)}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                style={{ ...styles.btn, backgroundColor: "#151c2c", border: "1px solid #2a3548" }}
                onClick={() => setTeleportTarget(null)}
              >
                Cancel
              </button>
              <button style={styles.btn} onClick={handleTeleport}>
                Teleport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
