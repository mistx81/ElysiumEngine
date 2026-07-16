import { useState, useEffect, useRef } from 'react';
import type {
  NPCCore,
  CognitiveEvent,
  WorldState,
  EmotionLabel,
  BigFiveTrait,
  MemoryType,
  Relationship,
  MemoryRecord,
  EpisodicEvent,
  MoodLabel,
} from '../engine/types';
import { useElysiumStore, seedNPCs } from '../hooks/useElysiumStore';

const EMOTION_LABELS: EmotionLabel[] = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
const BIG_FIVE: BigFiveTrait[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
const MEMORY_TYPES: MemoryType[] = ['working', 'short', 'long', 'semantic', 'procedural', 'flashbulb', 'trauma'];
const LIVE_EVENT_TYPES = new Set(['WORLD_EVENT', 'SOCIAL_INTERACTION', 'ECONOMY_TRANSACTION']);

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: '#fbbf24',
  sadness: '#60a5fa',
  anger: '#ef4444',
  fear: '#a78bfa',
  disgust: '#10b981',
  surprise: '#f59e0b',
};

const MOOD_COLORS: Record<MoodLabel, string> = {
  euphoric: '#fbbf24',
  happy: '#f59e0b',
  content: '#10b981',
  calm: '#3b82f6',
  neutral: '#94a3b8',
  bored: '#64748b',
  sad: '#60a5fa',
  anxious: '#a78bfa',
  angry: '#ef4444',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  friend: '#10b981',
  enemy: '#ef4444',
  family: '#f59e0b',
  rival: '#a78bfa',
  acquaintance: '#94a3b8',
  romantic: '#ec4899',
  mentor: '#3b82f6',
  student: '#06b6d4',
};

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌱',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

const WEATHER_EMOJI: Record<string, string> = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  storm: '⛈️',
  snow: '🌨️',
  fog: '🌫️',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  WORLD_EVENT: '#f59e0b',
  SOCIAL_INTERACTION: '#10b981',
  ECONOMY_TRANSACTION: '#3b82f6',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function padColor(value: number): string {
  if (value > 0.2) return '#10b981';
  if (value < -0.2) return '#ef4444';
  return '#94a3b8';
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0e17',
    color: '#e2e8f0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: '#0d1320',
    borderBottom: '1px solid #2a3548',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    margin: 0,
    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    marginTop: '2px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
    animation: 'pulse 2s ease-in-out infinite',
  },
  statusDotIdle: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#64748b',
  },
  statusInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr 280px',
    gap: '1px',
    background: '#1a2333',
    flex: 1,
    minHeight: 0,
  },
  sidebar: {
    background: '#0d1320',
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#64748b',
    padding: '4px 8px',
    marginBottom: '4px',
  },
  npcCard: {
    background: '#151c2c',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  npcCardSelected: {
    background: '#1a2540',
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 1px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.15)',
  },
  npcCardHover: {
    borderColor: '#3b82f6',
    transform: 'translateY(-1px)',
  },
  npcName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
    margin: 0,
  },
  npcAction: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  npcMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  center: {
    background: '#0a0e17',
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightPanel: {
    background: '#0d1320',
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    background: '#151c2c',
    border: '1px solid #2a3548',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#64748b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardIcon: {
    fontSize: '14px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2a3548',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  profileName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },
  profileAge: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  goalBox: {
    background: '#0d1320',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  goalLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#64748b',
    fontWeight: 600,
  },
  goalValue: {
    fontSize: '14px',
    color: '#e2e8f0',
    fontWeight: 500,
  },
  goalPriority: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    alignSelf: 'flex-start',
  },
  traitRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  traitLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  traitValue: {
    color: '#e2e8f0',
    fontWeight: 500,
  },
  barTrack: {
    height: '6px',
    background: '#0a0e17',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  padBarTrack: {
    height: '6px',
    background: '#0a0e17',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  },
  padBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '1px',
    background: '#2a3548',
  },
  padBarFill: {
    height: '100%',
    borderRadius: '3px',
    position: 'absolute',
    top: 0,
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  emotionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emotionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  emotionName: {
    color: '#94a3b8',
  },
  emotionValue: {
    color: '#e2e8f0',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
  },
  moodBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'capitalize',
    alignSelf: 'flex-start',
  },
  padGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
  },
  padItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  padLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#64748b',
    fontWeight: 600,
  },
  padValue: {
    fontSize: '14px',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  thoughtsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  thoughtItem: {
    fontSize: '13px',
    color: '#cbd5e1',
    padding: '8px 12px',
    background: '#0d1320',
    borderRadius: '6px',
    borderLeft: '2px solid #3b82f6',
    lineHeight: '1.5',
  },
  memoryGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  memoryTypeHeader: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#64748b',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  memoryCount: {
    fontSize: '10px',
    color: '#475569',
    background: '#0a0e17',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  memoryItem: {
    padding: '8px 10px',
    background: '#0d1320',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderLeft: '2px solid #2a3548',
  },
  memoryContent: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  memoryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    color: '#64748b',
  },
  importanceBar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  importanceDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
  },
  relItem: {
    padding: '10px 12px',
    background: '#0d1320',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  relHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#e2e8f0',
  },
  relBadge: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  relBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  relBarValue: {
    color: '#94a3b8',
    fontVariantNumeric: 'tabular-nums',
  },
  bipolarBar: {
    height: '5px',
    background: '#0a0e17',
    borderRadius: '3px',
    position: 'relative',
    overflow: 'hidden',
  },
  bipolarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: '3px',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  eventItem: {
    padding: '10px 12px',
    background: '#0d1320',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderLeft: '3px solid',
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  eventType: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 600,
  },
  eventTime: {
    fontSize: '10px',
    color: '#64748b',
    fontVariantNumeric: 'tabular-nums',
  },
  eventDesc: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  worldStatRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: '#0d1320',
    borderRadius: '8px',
  },
  worldStatLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  worldStatValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  activeEvent: {
    padding: '10px 12px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  activeEventTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#f59e0b',
    textTransform: 'capitalize',
  },
  activeEventDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#64748b',
    fontSize: '14px',
    textAlign: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.5,
  },
  scrollArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  goalCompleted: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: '#0d1320',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  goalCheck: {
    color: '#10b981',
    fontSize: '14px',
  },
  scrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: '#2a3548 transparent',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

function BigFiveBars({ npc }: { npc: NPCCore }) {
  return (
    <>
      {BIG_FIVE.map((trait) => {
        const value = npc.personality[trait] ?? 0;
        const pct = Math.max(0, Math.min(100, value * 100));
        return (
          <div key={trait} style={styles.traitRow}>
            <div style={styles.traitLabel}>
              <span>{trait}</span>
              <span style={styles.traitValue}>{(value * 100).toFixed(0)}%</span>
            </div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                }}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function EmotionPanel({ npc }: { npc: NPCCore }) {
  const { pad, emotions, mood } = npc.emotions;
  const padEntries: [string, number][] = [
    ['Pleasure', pad.pleasure],
    ['Arousal', pad.arousal],
    ['Dominance', pad.dominance],
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>🎭</span>
        Emotions
      </h3>

      <div style={{ ...styles.moodBadge, background: `${MOOD_COLORS[mood]}22`, color: MOOD_COLORS[mood] }}>
        <span>●</span>
        {mood}
      </div>

      <div style={styles.padGrid}>
        {padEntries.map(([label, value]) => {
          const abs = Math.abs(value);
          const pct = (abs / 1) * 50;
          const isPositive = value >= 0;
          return (
            <div key={label} style={styles.padItem}>
              <span style={styles.padLabel}>{label}</span>
              <span style={{ ...styles.padValue, color: padColor(value) }}>
                {value >= 0 ? '+' : ''}
                {value.toFixed(2)}
              </span>
              <div style={styles.padBarTrack}>
                <div style={styles.padBarCenter} />
                <div
                  style={{
                    ...styles.padBarFill,
                    width: `${pct}%`,
                    left: isPositive ? '50%' : `${50 - pct}%`,
                    background: padColor(value),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {EMOTION_LABELS.map((emo) => {
          const value = emotions[emo] ?? 0;
          const pct = Math.max(0, Math.min(100, value));
          return (
            <div key={emo} style={styles.emotionRow}>
              <div style={styles.emotionLabel}>
                <span style={styles.emotionName}>{emo}</span>
                <span style={styles.emotionValue}>{value.toFixed(0)}</span>
              </div>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${pct}%`,
                    background: EMOTION_COLORS[emo],
                    boxShadow: value > 50 ? `0 0 8px ${EMOTION_COLORS[emo]}66` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemoryPanel({ npc }: { npc: NPCCore }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>🧠</span>
        Memories
      </h3>
      <div style={styles.scrollArea}>
        {MEMORY_TYPES.map((type) => {
          const records = npc.memories[type] ?? [];
          if (records.length === 0) return null;
          return (
            <div key={type} style={styles.memoryGroup}>
              <div style={styles.memoryTypeHeader}>
                {type}
                <span style={styles.memoryCount}>{records.length}</span>
              </div>
              {records.slice(0, 5).map((mem: MemoryRecord) => (
                <div key={mem.id} style={styles.memoryItem}>
                  <div style={styles.memoryContent}>{mem.content}</div>
                  <div style={styles.memoryMeta}>
                    <span>Importance: {(mem.importance * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>{mem.accessCount} recalls</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {MEMORY_TYPES.every((t) => (npc.memories[t] ?? []).length === 0) && (
          <div style={{ ...styles.emptyState, padding: '20px' }}>
            <span style={styles.emptyIcon}>📭</span>
            No memories yet
          </div>
        )}
      </div>
    </div>
  );
}

function GoalsPanel({ npc }: { npc: NPCCore }) {
  const completedGoals = npc.episodicEvents.filter(
    (e: EpisodicEvent) => e.type === 'goal_completed' || e.type === 'GOAL_COMPLETED',
  );

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>🎯</span>
        Goals
      </h3>
      {npc.currentGoal ? (
        <div style={styles.goalBox}>
          <span style={styles.goalLabel}>Current Goal</span>
          <span style={styles.goalValue}>{npc.currentGoal.name}</span>
          <span style={styles.goalPriority}>Priority {npc.currentGoal.priority}</span>
        </div>
      ) : (
        <div style={{ ...styles.emptyState, padding: '16px' }}>
          <span style={styles.emptyIcon}>🌙</span>
          No active goal
        </div>
      )}
      {completedGoals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ ...styles.memoryTypeHeader, marginTop: '4px' }}>
            Completed
            <span style={styles.memoryCount}>{completedGoals.length}</span>
          </span>
          {completedGoals.slice(0, 8).map((g) => (
            <div key={g.id} style={styles.goalCompleted}>
              <span style={styles.goalCheck}>✓</span>
              <span>{g.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipsPanel({ npc, npcs }: { npc: NPCCore; npcs: NPCCore[] }) {
  const rels = Object.values(npc.relationships);
  const npcMap = new Map(npcs.map((n) => [n.id, n]));

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>🤝</span>
        Relationships
      </h3>
      {rels.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '16px' }}>
          <span style={styles.emptyIcon}>🕊️</span>
          No relationships formed
        </div>
      ) : (
        <div style={styles.scrollArea}>
          {rels.map((rel: Relationship) => {
            const other = npcMap.get(rel.npcId);
            const trustPct = Math.abs(rel.trust) / 2;
            const affinityPct = Math.max(0, Math.min(100, rel.affinity));
            const trustColor = rel.trust >= 0 ? '#10b981' : '#ef4444';
            const relColor = RELATIONSHIP_COLORS[rel.type] ?? '#94a3b8';
            return (
              <div key={rel.npcId} style={styles.relItem}>
                <div style={styles.relHeader}>
                  <span style={styles.relName}>{other?.name ?? rel.npcId}</span>
                  <span style={{ ...styles.relBadge, background: `${relColor}22`, color: relColor }}>
                    {rel.type}
                  </span>
                </div>
                <div style={styles.traitRow}>
                  <div style={styles.relBarLabel}>
                    <span>Trust</span>
                    <span style={styles.relBarValue}>
                      {rel.trust >= 0 ? '+' : ''}
                      {rel.trust.toFixed(0)}
                    </span>
                  </div>
                  <div style={styles.bipolarBar}>
                    <div
                      style={{
                        ...styles.bipolarFill,
                        width: `${trustPct}%`,
                        left: rel.trust >= 0 ? '50%' : `${50 - trustPct}%`,
                        background: trustColor,
                      }}
                    />
                  </div>
                </div>
                <div style={styles.traitRow}>
                  <div style={styles.relBarLabel}>
                    <span>Affinity</span>
                    <span style={styles.relBarValue}>{rel.affinity.toFixed(0)}</span>
                  </div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${affinityPct}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThoughtsPanel({ npc }: { npc: NPCCore }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>💭</span>
        Thoughts
      </h3>
      {npc.thoughtHistory.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '16px' }}>
          <span style={styles.emptyIcon}>🤐</span>
          No thoughts yet
        </div>
      ) : (
        <div style={styles.thoughtsList}>
          {npc.thoughtHistory.slice(-12).reverse().map((thought, i) => (
            <div key={i} style={styles.thoughtItem}>
              {thought}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveEventsPanel({ events }: { events: CognitiveEvent[] }) {
  const filtered = events.filter((e) => LIVE_EVENT_TYPES.has(e.type)).slice(-20).reverse();

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.liveDot} />
        Live Events
      </h3>
      {filtered.length === 0 ? (
        <div style={{ ...styles.emptyState, padding: '16px' }}>
          <span style={styles.emptyIcon}>📡</span>
          Waiting for world events...
        </div>
      ) : (
        <div style={styles.scrollArea}>
          {filtered.map((evt) => {
            const color = EVENT_TYPE_COLORS[evt.type] ?? '#94a3b8';
            const desc =
              evt.data?.description ??
              evt.data?.message ??
              evt.data?.activity ??
              evt.data?.action ??
              evt.source;
            return (
              <div key={evt.id} style={{ ...styles.eventItem, borderLeftColor: color }}>
                <div style={styles.eventHeader}>
                  <span style={{ ...styles.eventType, color }}>{evt.type.replace(/_/g, ' ')}</span>
                  <span style={styles.eventTime}>{formatTime(evt.timestamp)}</span>
                </div>
                <div style={styles.eventDesc}>{String(desc)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorldStatePanel({ world }: { world: WorldState }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>
        <span style={styles.cardIcon}>🌍</span>
        World State
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={styles.worldStatRow}>
          <span style={styles.worldStatLabel}>Day</span>
          <span style={styles.worldStatValue}>{world.day}</span>
        </div>
        <div style={styles.worldStatRow}>
          <span style={styles.worldStatLabel}>Hour</span>
          <span style={styles.worldStatValue}>
            {String(world.hour).padStart(2, '0')}:00
          </span>
        </div>
        <div style={styles.worldStatRow}>
          <span style={styles.worldStatLabel}>Season</span>
          <span style={styles.worldStatValue}>
            <span>{SEASON_EMOJI[world.season] ?? '🌿'}</span>
            {world.season}
          </span>
        </div>
        <div style={styles.worldStatRow}>
          <span style={styles.worldStatLabel}>Weather</span>
          <span style={styles.worldStatValue}>
            <span>{WEATHER_EMOJI[world.weather] ?? '☀️'}</span>
            {world.weather}
          </span>
        </div>
      </div>
      {world.activeEvents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ ...styles.memoryTypeHeader, marginTop: '4px' }}>
            Active Events
            <span style={styles.memoryCount}>{world.activeEvents.length}</span>
          </span>
          {world.activeEvents.map((evt) => (
            <div key={evt.id} style={styles.activeEvent}>
              <span style={styles.activeEventTitle}>
                {SEASON_EMOJI[evt.type] ? '' : '⚠️'} {evt.type.replace(/_/g, ' ')}
              </span>
              <span style={styles.activeEventDesc}>{evt.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NPCCard({
  npc,
  selected,
  onClick,
}: {
  npc: NPCCore;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const style: React.CSSProperties = {
    ...styles.npcCard,
    ...(selected ? styles.npcCardSelected : {}),
    ...(hovered && !selected ? styles.npcCardHover : {}),
  };

  return (
    <div
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={styles.npcName}>{npc.name}</p>
      <div style={styles.npcMeta}>
        <span>Age {npc.age}</span>
        <span>·</span>
        <span style={{ color: '#3b82f6' }}>{npc.lodLevel}</span>
      </div>
      <p style={styles.npcAction}>{npc.currentAction ?? 'idle'}</p>
    </div>
  );
}

export default function HomePage() {
  const store = useElysiumStore();
  const { npcs, selectedNPCId, selectNPC, selectedNPC, events, worldState, isRunning, tickCount } = store;
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    seedNPCs();
  }, []);

  useEffect(() => {
    if (npcs.length > 0 && !selectedNPCId) {
      selectNPC(npcs[0].id);
    }
  }, [npcs, selectedNPCId, selectNPC]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Elysium Engine</h1>
          <p style={styles.headerSubtitle}>Autonomous NPC Simulation</p>
        </div>
        <div style={styles.statusInfo}>
          <div style={isRunning ? styles.statusDot : styles.statusDotIdle} />
          <span>{isRunning ? 'Simulation Running' : 'Simulation Paused'}</span>
          <span style={{ color: '#475569' }}>·</span>
          <span>Tick {tickCount}</span>
          <span style={{ color: '#475569' }}>·</span>
          <span>{npcs.length} NPCs</span>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Characters</div>
          {npcs.length === 0 ? (
            <div style={{ ...styles.emptyState, padding: '20px' }}>
              <span style={styles.emptyIcon}>👥</span>
              No NPCs initialized
            </div>
          ) : (
            npcs.map((npc) => (
              <NPCCard
                key={npc.id}
                npc={npc}
                selected={selectedNPCId === npc.id}
                onClick={() => selectNPC(npc.id)}
              />
            ))
          )}
        </aside>

        <main style={styles.center}>
          {selectedNPC ? (
            <>
              <div style={styles.card}>
                <div style={styles.profileHeader}>
                  <div style={styles.avatar}>
                    {selectedNPC.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.profileInfo}>
                    <h2 style={styles.profileName}>{selectedNPC.name}</h2>
                    <p style={styles.profileAge}>
                      Age {selectedNPC.age} · {selectedNPC.lodLevel} priority
                    </p>
                    <div style={{ ...styles.moodBadge, background: `${MOOD_COLORS[selectedNPC.emotions.mood]}22`, color: MOOD_COLORS[selectedNPC.emotions.mood], marginTop: '4px' }}>
                      <span>●</span>
                      {selectedNPC.emotions.mood}
                    </div>
                  </div>
                </div>

                <div style={styles.grid2}>
                  <div style={styles.goalBox}>
                    <span style={styles.goalLabel}>Current Goal</span>
                    <span style={styles.goalValue}>
                      {selectedNPC.currentGoal?.name ?? 'No active goal'}
                    </span>
                    {selectedNPC.currentGoal && (
                      <span style={styles.goalPriority}>
                        Priority {selectedNPC.currentGoal.priority}
                      </span>
                    )}
                  </div>
                  <div style={styles.goalBox}>
                    <span style={styles.goalLabel}>Current Action</span>
                    <span style={styles.goalValue}>
                      {selectedNPC.currentAction ?? 'idle'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ ...styles.memoryTypeHeader, marginTop: '4px' }}>
                    Personality
                  </span>
                  <BigFiveBars npc={selectedNPC} />
                </div>
              </div>

              <div style={styles.grid2}>
                <ThoughtsPanel npc={selectedNPC} />
                <EmotionPanel npc={selectedNPC} />
              </div>

              <MemoryPanel npc={selectedNPC} />

              <div style={styles.grid2}>
                <GoalsPanel npc={selectedNPC} />
                <RelationshipsPanel npc={selectedNPC} npcs={npcs} />
              </div>

              <LiveEventsPanel events={events} />
            </>
          ) : (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>👤</span>
              <span>Select a character to view their profile</span>
            </div>
          )}
        </main>

        <aside style={styles.rightPanel}>
          <WorldStatePanel world={worldState} />
          <LiveEventsPanel events={events} />
        </aside>
      </div>
    </div>
  );
}
