import { useState, useEffect, useRef } from 'react';
import type {
  NPCCore,
  CognitiveEvent,
  WorldState,
  EmotionLabel,
  BigFiveTrait,
  MemoryType,
  MoodLabel,
  RelationshipType,
  MemoryRecord,
  Relationship,
  EpisodicEvent,
} from '../engine/types';
import { useElysiumStore, seedNPCs } from '../hooks/useElysiumStore';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  cardHover: '#1a2236',
  border: '#2a3548',
  borderHover: '#3b82f6',
  text: '#e2e8f0',
  textMid: '#94a3b8',
  textDim: '#64748b',
  accent: '#3b82f6',
  accentDim: '#1e3a5f',
  positive: '#22c55e',
  negative: '#ef4444',
  warning: '#f59e0b',
};

const BIG_FIVE: BigFiveTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

const EMOTION_LABELS: EmotionLabel[] = [
  'joy',
  'sadness',
  'anger',
  'fear',
  'disgust',
  'surprise',
];

const MEMORY_TYPES: MemoryType[] = [
  'working',
  'short',
  'long',
  'semantic',
  'procedural',
  'flashbulb',
  'trauma',
];

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: '#fbbf24',
  sadness: '#3b82f6',
  anger: '#ef4444',
  fear: '#8b5cf6',
  disgust: '#10b981',
  surprise: '#f97316',
};

const MOOD_COLORS: Record<MoodLabel, string> = {
  euphoric: '#fbbf24',
  happy: '#22c55e',
  content: '#84cc16',
  calm: '#06b6d4',
  neutral: '#64748b',
  bored: '#94a3b8',
  sad: '#3b82f6',
  anxious: '#f59e0b',
  angry: '#ef4444',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  friend: '#22c55e',
  enemy: '#ef4444',
  family: '#f59e0b',
  rival: '#f97316',
  acquaintance: '#64748b',
  romantic: '#ec4899',
  mentor: '#06b6d4',
  student: '#8b5cf6',
};

const LIVE_EVENT_TYPES = new Set([
  'WORLD_EVENT',
  'SOCIAL_INTERACTION',
  'ECONOMY_TRANSACTION',
]);

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    minWidth: 240,
    height: '100vh',
    backgroundColor: COLORS.card,
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px 14px',
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: COLORS.textDim,
  },
  sidebarList: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
  },
  npcCard: {
    padding: '10px 12px',
    borderRadius: 8,
    marginBottom: 6,
    cursor: 'pointer',
    border: `1px solid transparent`,
    transition: 'all 0.2s ease',
  },
  npcCardHover: {
    backgroundColor: COLORS.cardHover,
  },
  npcCardSelected: {
    backgroundColor: COLORS.accentDim,
    border: `1px solid ${COLORS.accent}`,
  },
  npcName: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 3,
  },
  npcAction: {
    fontSize: 11,
    color: COLORS.textDim,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  center: {
    flex: 1,
    height: '100vh',
    overflowY: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightPanel: {
    width: 280,
    minWidth: 280,
    height: '100vh',
    backgroundColor: COLORS.card,
    borderLeft: `1px solid ${COLORS.border}`,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  panel: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: 16,
    transition: 'border-color 0.2s ease',
  },
  panelHover: {
    borderColor: COLORS.borderHover,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: COLORS.textDim,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  panelBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 4,
    backgroundColor: COLORS.accentDim,
    color: COLORS.accent,
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.text,
  },
  profileAge: {
    fontSize: 13,
    color: COLORS.textMid,
    backgroundColor: COLORS.bg,
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  traitRow: {
    marginBottom: 10,
  },
  traitLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: COLORS.textMid,
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  traitValue: {
    color: COLORS.text,
    fontWeight: 600,
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  padBarTrack: {
    height: 6,
    backgroundColor: COLORS.bg,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  padBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.border,
  },
  padBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 3,
    transition: 'all 0.5s ease',
  },
  goalBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
  },
  goalName: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 4,
  },
  goalPriority: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  actionBox: {
    backgroundColor: COLORS.accentDim,
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: COLORS.accent,
    animation: 'elysiumPulse 1.5s ease-in-out infinite',
  },
  actionText: {
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.text,
  },
  thoughtItem: {
    padding: '8px 10px',
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    marginBottom: 6,
    fontSize: 12,
    color: COLORS.textMid,
    lineHeight: 1.5,
    borderLeft: `2px solid ${COLORS.border}`,
  },
  memoryGroup: {
    marginBottom: 14,
  },
  memoryGroupTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textDim,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  memoryCount: {
    fontSize: 10,
    backgroundColor: COLORS.bg,
    padding: '1px 6px',
    borderRadius: 4,
    color: COLORS.textDim,
  },
  memoryItem: {
    padding: '8px 10px',
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    marginBottom: 5,
    fontSize: 12,
    color: COLORS.textMid,
    lineHeight: 1.4,
  },
  memoryMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textDim,
  },
  emotionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 14,
  },
  emotionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  emotionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: COLORS.textMid,
    textTransform: 'capitalize' as const,
  },
  moodBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  padRow: {
    marginBottom: 10,
  },
  padLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: COLORS.textMid,
    marginBottom: 4,
    textTransform: 'capitalize' as const,
  },
  completedGoal: {
    padding: '8px 10px',
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    marginBottom: 5,
    fontSize: 12,
    color: COLORS.textMid,
    borderLeft: `2px solid ${COLORS.positive}`,
  },
  relItem: {
    padding: '10px 12px',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    marginBottom: 8,
  },
  relHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  relName: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
  },
  relTypeBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'capitalize' as const,
  },
  relBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: COLORS.textDim,
    marginBottom: 3,
  },
  relBarTrack: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  relBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.textDim,
    opacity: 0.4,
  },
  eventItem: {
    padding: '8px 10px',
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    marginBottom: 6,
    fontSize: 12,
    borderLeft: `3px solid ${COLORS.accent}`,
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  eventType: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  eventTime: {
    fontSize: 10,
    color: COLORS.textDim,
  },
  eventDesc: {
    fontSize: 11,
    color: COLORS.textMid,
    lineHeight: 1.4,
  },
  worldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    marginBottom: 8,
  },
  worldLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  worldValue: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
    textTransform: 'capitalize' as const,
  },
  activeEvent: {
    padding: '10px 12px',
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    marginBottom: 8,
    borderLeft: `3px solid ${COLORS.warning}`,
  },
  activeEventType: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.warning,
    textTransform: 'uppercase' as const,
    marginBottom: 3,
  },
  activeEventDesc: {
    fontSize: 12,
    color: COLORS.textMid,
    lineHeight: 1.4,
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: COLORS.textDim,
    fontSize: 13,
  },
  scrollList: {
    maxHeight: 240,
    overflowY: 'auto',
    paddingRight: 4,
  },
};

const KEYFRAMES_CSS = `
@keyframes elysiumPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}
@keyframes elysiumFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function padBarStyle(value: number, color: string): React.CSSProperties {
  const pct = Math.abs(value) * 50;
  const positive = value >= 0;
  return {
    left: positive ? '50%' : `${50 - pct}%`,
    width: `${pct}%`,
    backgroundColor: color,
  };
}

function bipolarBarStyle(value: number, min: number, max: number, color: string): React.CSSProperties {
  const range = max - min;
  const normalized = (value - min) / range;
  const center = (0 - min) / range;
  const pct = Math.abs(normalized - center) * 100;
  const positive = value >= 0;
  return {
    left: positive ? `${center * 100}%` : `${normalized * 100}%`,
    width: `${pct}%`,
    backgroundColor: color,
  };
}

function Section({
  title,
  badge,
  children,
  style,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...s.panel, ...style }}>
      <div style={s.panelTitle}>
        {title}
        {badge && <span style={s.panelBadge}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function NPCList({
  npcs,
  selectedId,
  onSelect,
}: {
  npcs: NPCCore[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={s.sidebarList}>
      {npcs.length === 0 && (
        <div style={s.emptyState}>No NPCs in world</div>
      )}
      {npcs.map((npc) => {
        const selected = npc.id === selectedId;
        return (
          <div
            key={npc.id}
            onClick={() => onSelect(npc.id)}
            style={{
              ...s.npcCard,
              ...(selected ? s.npcCardSelected : {}),
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.backgroundColor = COLORS.cardHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={s.npcName}>{npc.name}</div>
            <div style={s.npcAction}>
              {npc.currentAction || 'Idle'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonalityPanel({ npc }: { npc: NPCCore }) {
  return (
    <Section title="Personality" badge="Big Five">
      {BIG_FIVE.map((trait) => {
        const val = npc.personality[trait] ?? 0;
        const pct = val * 100;
        return (
          <div key={trait} style={s.traitRow}>
            <div style={s.traitLabel}>
              <span>{trait}</span>
              <span style={s.traitValue}>{(val * 100).toFixed(0)}%</span>
            </div>
            <div style={s.barTrack}>
              <div
                style={{
                  ...s.barFill,
                  width: `${pct}%`,
                  backgroundColor: COLORS.accent,
                }}
              />
            </div>
          </div>
        );
      })}
    </Section>
  );
}

function GoalActionPanel({ npc }: { npc: NPCCore }) {
  return (
    <Section title="Current Objective">
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...s.panelTitle, marginBottom: 8 }}>Goal</div>
        {npc.currentGoal ? (
          <div style={s.goalBox}>
            <div style={s.goalName}>{npc.currentGoal.name}</div>
            <div style={s.goalPriority}>
              Priority: {npc.currentGoal.priority.toFixed(2)}
            </div>
          </div>
        ) : (
          <div style={{ ...s.emptyState, padding: '12px 0' }}>
            No active goal
          </div>
        )}
      </div>
      <div>
        <div style={{ ...s.panelTitle, marginBottom: 8 }}>Action</div>
        {npc.currentAction ? (
          <div style={s.actionBox}>
            <div style={s.actionDot} />
            <div style={s.actionText}>{npc.currentAction}</div>
          </div>
        ) : (
          <div style={{ ...s.emptyState, padding: '12px 0' }}>
            No active action
          </div>
        )}
      </div>
    </Section>
  );
}

function ThoughtsPanel({ npc }: { npc: NPCCore }) {
  const thoughts = npc.thoughtHistory ?? [];
  return (
    <Section title="Thoughts" badge={`${thoughts.length}`}>
      <div style={s.scrollList}>
        {thoughts.length === 0 && (
          <div style={{ ...s.emptyState, padding: '16px 0' }}>
            No thoughts recorded
          </div>
        )}
        {thoughts.slice(-30).reverse().map((thought, i) => (
          <div
            key={i}
            style={{
              ...s.thoughtItem,
              animation: 'elysiumFadeIn 0.3s ease',
            }}
          >
            {thought}
          </div>
        ))}
      </div>
    </Section>
  );
}

function MemoriesPanel({ npc }: { npc: NPCCore }) {
  const memories = npc.memories;
  return (
    <Section title="Memories" badge="7 types">
      <div style={s.scrollList}>
        {MEMORY_TYPES.map((type) => {
          const records: MemoryRecord[] = memories[type] ?? [];
          if (records.length === 0) return null;
          return (
            <div key={type} style={s.memoryGroup}>
              <div style={s.memoryGroupTitle}>
                {type}
                <span style={s.memoryCount}>{records.length}</span>
              </div>
              {records.slice(0, 8).map((mem) => (
                <div key={mem.id} style={s.memoryItem}>
                  <div>{mem.content}</div>
                  <div style={s.memoryMeta}>
                    <span>Importance: {mem.importance.toFixed(2)}</span>
                    <span>Accesses: {mem.accessCount}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {MEMORY_TYPES.every((t) => (memories[t] ?? []).length === 0) && (
          <div style={{ ...s.emptyState, padding: '16px 0' }}>
            No memories formed yet
          </div>
        )}
      </div>
    </Section>
  );
}

function EmotionsPanel({ npc }: { npc: NPCCore }) {
  const { pad, emotions, mood } = npc.emotions;
  const moodColor = MOOD_COLORS[mood] ?? COLORS.textDim;
  return (
    <Section title="Emotional State">
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...s.panelTitle, marginBottom: 8 }}>Mood</div>
        <span
          style={{
            ...s.moodBadge,
            backgroundColor: `${moodColor}22`,
            color: moodColor,
            border: `1px solid ${moodColor}44`,
          }}
        >
          {mood}
        </span>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...s.panelTitle, marginBottom: 10 }}>PAD Model</div>
        {(['pleasure', 'arousal', 'dominance'] as const).map((key) => {
          const val = pad[key];
          const color = val >= 0 ? COLORS.positive : COLORS.negative;
          return (
            <div key={key} style={s.padRow}>
              <div style={s.padLabel}>
                <span>{key}</span>
                <span style={{ color: COLORS.text }}>{val.toFixed(2)}</span>
              </div>
              <div style={s.padBarTrack}>
                <div style={s.padBarCenter} />
                <div
                  style={{
                    ...s.padBarFill,
                    ...padBarStyle(val, color),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <div style={{ ...s.panelTitle, marginBottom: 10 }}>Emotions</div>
        <div style={s.emotionGrid}>
          {EMOTION_LABELS.map((label) => {
            const val = emotions[label] ?? 0;
            const pct = Math.min(100, Math.max(0, val));
            const color = EMOTION_COLORS[label];
            return (
              <div key={label} style={s.emotionRow}>
                <div style={s.emotionLabel}>
                  <span>{label}</span>
                  <span style={{ color: COLORS.text }}>{pct.toFixed(0)}</span>
                </div>
                <div style={s.barTrack}>
                  <div
                    style={{
                      ...s.barFill,
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function GoalsPanel({ npc }: { npc: NPCCore }) {
  const completedGoals: EpisodicEvent[] = (npc.episodicEvents ?? []).filter(
    (e) => e.type === 'goal_completed' || e.type === 'GOAL_COMPLETED'
  );
  return (
    <Section title="Goals" badge={`${completedGoals.length} done`}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...s.panelTitle, marginBottom: 8 }}>Current Goal</div>
        {npc.currentGoal ? (
          <div style={s.goalBox}>
            <div style={s.goalName}>{npc.currentGoal.name}</div>
            <div style={s.goalPriority}>
              Priority: {npc.currentGoal.priority.toFixed(2)}
            </div>
          </div>
        ) : (
          <div style={{ ...s.emptyState, padding: '12px 0' }}>
            No active goal
          </div>
        )}
      </div>
      <div>
        <div style={{ ...s.panelTitle, marginBottom: 8 }}>Completed Goals</div>
        <div style={s.scrollList}>
          {completedGoals.length === 0 && (
            <div style={{ ...s.emptyState, padding: '12px 0' }}>
              No completed goals yet
            </div>
          )}
          {completedGoals.slice(0, 20).map((evt) => (
            <div key={evt.id} style={s.completedGoal}>
              <div>{evt.description}</div>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 3 }}>
                {formatTime(evt.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function RelationshipsPanel({ npc }: { npc: NPCCore }) {
  const rels = Object.values(npc.relationships ?? {});
  return (
    <Section title="Relationships" badge={`${rels.length}`}>
      <div style={s.scrollList}>
        {rels.length === 0 && (
          <div style={{ ...s.emptyState, padding: '16px 0' }}>
            No relationships formed
          </div>
        )}
        {rels.map((rel: Relationship) => {
          const typeColor = RELATIONSHIP_COLORS[rel.type] ?? COLORS.textDim;
          return (
            <div key={rel.npcId} style={s.relItem}>
              <div style={s.relHeader}>
                <span style={s.relName}>{rel.npcId}</span>
                <span
                  style={{
                    ...s.relTypeBadge,
                    backgroundColor: `${typeColor}22`,
                    color: typeColor,
                  }}
                >
                  {rel.type}
                </span>
              </div>
              <div style={s.relBarLabel}>
                <span>Trust</span>
                <span style={{ color: COLORS.text }}>
                  {rel.trust.toFixed(0)}
                </span>
              </div>
              <div style={{ ...s.relBarTrack, marginBottom: 8 }}>
                <div style={s.relBarCenter} />
                <div
                  style={{
                    ...s.barFill,
                    ...bipolarBarStyle(
                      rel.trust,
                      -100,
                      100,
                      rel.trust >= 0 ? COLORS.positive : COLORS.negative
                    ),
                  }}
                />
              </div>
              <div style={s.relBarLabel}>
                <span>Affinity</span>
                <span style={{ color: COLORS.text }}>
                  {rel.affinity.toFixed(0)}
                </span>
              </div>
              <div style={s.relBarTrack}>
                <div style={s.relBarCenter} />
                <div
                  style={{
                    ...s.barFill,
                    ...bipolarBarStyle(
                      rel.affinity,
                      -100,
                      100,
                      rel.affinity >= 0 ? COLORS.accent : COLORS.negative
                    ),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function LiveEventsPanel({ events }: { events: CognitiveEvent[] }) {
  const filtered = events.filter((e) => LIVE_EVENT_TYPES.has(e.type));
  return (
    <Section title="Live Events" badge={`${filtered.length}`}>
      <div style={s.scrollList}>
        {filtered.length === 0 && (
          <div style={{ ...s.emptyState, padding: '16px 0' }}>
            No world events yet
          </div>
        )}
        {filtered.slice(-30).reverse().map((evt) => (
          <div key={evt.id} style={s.eventItem}>
            <div style={s.eventHeader}>
              <span style={s.eventType}>{evt.type}</span>
              <span style={s.eventTime}>{formatTime(evt.timestamp)}</span>
            </div>
            <div style={s.eventDesc}>
              {evt.data?.description || evt.data?.message || evt.data?.type || evt.source}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function WorldStatePanel({ world }: { world: WorldState | null }) {
  if (!world) {
    return (
      <Section title="World State">
        <div style={s.emptyState}>World not initialized</div>
      </Section>
    );
  }
  const activeEvents = world.activeEvents ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...s.panelTitle, padding: '0 4px' }}>World State</div>
      <div style={s.worldRow}>
        <span style={s.worldLabel}>Day</span>
        <span style={s.worldValue}>{world.day}</span>
      </div>
      <div style={s.worldRow}>
        <span style={s.worldLabel}>Hour</span>
        <span style={s.worldValue}>
          {String(world.hour).padStart(2, '0')}:00
        </span>
      </div>
      <div style={s.worldRow}>
        <span style={s.worldLabel}>Season</span>
        <span style={s.worldValue}>{world.season}</span>
      </div>
      <div style={s.worldRow}>
        <span style={s.worldLabel}>Weather</span>
        <span style={s.worldValue}>{world.weather}</span>
      </div>
      <div>
        <div style={{ ...s.panelTitle, marginBottom: 8, padding: '0 4px' }}>
          Active Events
          {activeEvents.length > 0 && (
            <span style={s.panelBadge}>{activeEvents.length}</span>
          )}
        </div>
        {activeEvents.length === 0 && (
          <div style={{ ...s.emptyState, padding: '12px 0' }}>
            No active events
          </div>
        )}
        {activeEvents.map((evt) => (
          <div key={evt.id} style={s.activeEvent}>
            <div style={s.activeEventType}>{evt.type}</div>
            <div style={s.activeEventDesc}>{evt.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductionUI() {
  const store = useElysiumStore();
  const { npcs, selectedNPC, selectedNPCId, selectNPC, events, worldState } = store;
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedNPCs();
    }
  }, []);

  return (
    <>
      <style>{KEYFRAMES_CSS}</style>
      <div style={s.root}>
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>Elysium · Population</div>
          <NPCList
            npcs={npcs}
            selectedId={selectedNPCId}
            onSelect={selectNPC}
          />
        </div>

        <div style={s.center}>
          {!selectedNPC ? (
            <div style={s.emptyState}>
              Select a citizen to view their profile
            </div>
          ) : (
            <>
              <Section title="Citizen Profile">
                <div style={s.profileHeader}>
                  <span style={s.profileName}>{selectedNPC.name}</span>
                  <span style={s.profileAge}>Age {selectedNPC.age}</span>
                </div>
                <div style={s.goalBox}>
                  <div style={{ ...s.goalName, fontSize: 13, marginBottom: 4 }}>
                    {selectedNPC.currentGoal
                      ? selectedNPC.currentGoal.name
                      : 'No active goal'}
                  </div>
                  <div style={s.goalPriority}>
                    {selectedNPC.currentAction
                      ? selectedNPC.currentAction
                      : 'Idle'}
                  </div>
                </div>
              </Section>

              <PersonalityPanel npc={selectedNPC} />
              <GoalActionPanel npc={selectedNPC} />
              <EmotionsPanel npc={selectedNPC} />
              <ThoughtsPanel npc={selectedNPC} />
              <MemoriesPanel npc={selectedNPC} />
              <GoalsPanel npc={selectedNPC} />
              <RelationshipsPanel npc={selectedNPC} />
              <LiveEventsPanel events={events} />
            </>
          )}
        </div>

        <div style={s.rightPanel}>
          <WorldStatePanel world={worldState} />
        </div>
      </div>
    </>
  );
}
