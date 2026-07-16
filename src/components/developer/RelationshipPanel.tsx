import { useState } from 'react';
import type { NPCCore, Relationship, RelationshipType } from '../../engine/types';

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

const REL_TYPES: RelationshipType[] = ['friend', 'enemy', 'family', 'rival', 'acquaintance', 'romantic', 'mentor', 'student'];

const TYPE_COLORS: Record<RelationshipType, string> = {
  friend: COLORS.success,
  enemy: COLORS.error,
  family: COLORS.accent,
  rival: COLORS.warning,
  acquaintance: COLORS.muted,
  romantic: '#ec4899',
  mentor: COLORS.info,
  student: '#06b6d4',
};

function bipolarBar(label: string, value: number, color: string): any {
  const pct = Math.abs(value) / 2;
  const isPositive = value >= 0;
  return {
    marginBottom: '8px',
    label: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' },
    track: { position: 'relative', height: '6px', background: COLORS.border, borderRadius: '3px', overflow: 'hidden' },
    center: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: COLORS.muted, zIndex: 1 },
    fill: {
      position: 'absolute', top: 0, bottom: 0, borderRadius: '3px',
      width: `${pct}%`,
      left: isPositive ? '50%' : `${50 - pct}%`,
      background: color,
    },
    value,
  };
}

export default function RelationshipPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const allNPCs: NPCCore[] = props.allNPCs ?? [];
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<RelationshipType>('friend');

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    list: { flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    targetName: { fontWeight: 700, fontSize: '13px' },
    typeTag: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', color: '#fff' },
    barLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' },
    barTrack: { position: 'relative', height: '6px', background: COLORS.border, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' },
    barCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: COLORS.muted, zIndex: 1 },
    barFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: '3px' },
    history: { marginTop: '6px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '6px' },
    historyTitle: { fontSize: '10px', color: COLORS.muted, marginBottom: '4px' },
    historyItem: { fontSize: '10px', color: COLORS.muted, padding: '2px 0' },
    addForm: { display: 'flex', gap: '6px', alignItems: 'center' },
    select: { background: COLORS.card, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px' },
    btn: { background: COLORS.accent, color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 },
    btnDanger: { background: 'transparent', color: COLORS.error, border: `1px solid ${COLORS.error}`, borderRadius: '4px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer' },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view relationships</div></div>;
  }

  const relationships: Relationship[] = Object.values(npc.relationships ?? {});
  const npcNameMap = new Map(allNPCs.map((n) => [n.id, n.name]));

  const handleAdd = () => {
    if (newTarget && props.onAddRelationship) props.onAddRelationship(npc.id, newTarget, newType);
    setNewTarget('');
  };

  const handleRemove = (targetId: string) => {
    if (props.onRemoveRelationship) props.onRemoveRelationship(npc.id, targetId);
  };

  const renderBipolar = (label: string, value: number, color: string) => {
    const pct = Math.abs(value) / 2;
    const isPositive = value >= 0;
    return (
      <div key={label}>
        <div style={styles.barLabel}>
          <span>{label}</span>
          <span style={{ color }}>{value > 0 ? '+' : ''}{value.toFixed(0)}</span>
        </div>
        <div style={styles.barTrack}>
          <div style={styles.barCenter} />
          <div style={{ ...styles.barFill, width: `${pct}%`, left: isPositive ? '50%' : `${50 - pct}%`, background: color }} />
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Relationships — {npc.name}</h3>
        <span style={{ fontSize: '11px', color: COLORS.muted }}>{relationships.length} connections</span>
      </div>

      <div style={styles.addForm}>
        <select style={styles.select} value={newTarget} onChange={(e) => setNewTarget(e.target.value)}>
          <option value="">Select NPC...</option>
          {allNPCs.filter((n) => n.id !== npc.id && !npc.relationships?.[n.id]).map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
        <select style={styles.select} value={newType} onChange={(e) => setNewType(e.target.value as RelationshipType)}>
          {REL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button style={styles.btn} onClick={handleAdd}>Add</button>
      </div>

      <div style={styles.list}>
        {relationships.length === 0 && <div style={{ ...styles.placeholder, height: 'auto', padding: '24px' }}>No relationships</div>}
        {relationships.map((rel) => (
          <div key={rel.npcId} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.targetName}>{npcNameMap.get(rel.npcId) ?? rel.npcId}</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ ...styles.typeTag, background: TYPE_COLORS[rel.type] }}>{rel.type}</span>
                <button style={styles.btnDanger} onClick={() => handleRemove(rel.npcId)}>Remove</button>
              </div>
            </div>
            {renderBipolar('Trust', rel.trust, COLORS.accent)}
            {renderBipolar('Affinity', rel.affinity, COLORS.success)}
            <div style={{ fontSize: '10px', color: COLORS.muted, marginBottom: '4px' }}>Familiarity: {rel.familiarity.toFixed(0)}</div>
            {rel.history.length > 0 && (
              <div style={styles.history}>
                <div style={styles.historyTitle}>History ({rel.history.length})</div>
                {rel.history.slice(-3).map((h, i) => (
                  <div key={i} style={styles.historyItem}>
                    {h.type}: {h.description} ({h.delta > 0 ? '+' : ''}{h.delta})
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
