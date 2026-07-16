import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  NPCCore,
  CognitiveEvent,
  LogEntry,
  PerformanceStats,
  CacheStats,
  BatchWriteStats,
  PersistenceStats,
  SchedulerStats,
  LODStats,
  ChunkStats,
  BackgroundStats,
  WorldState,
  GossipItem,
  Faction,
  EmotionLabel,
  MemoryType,
  LODLevel,
  CognitiveEventType,
  MemoryRecord,
  GOAPPlan,
  GOAPAction,
  GOAPGoal,
  UtilityDecision,
  NeedType,
  EconomyItemType,
  EconomyItem,
  EconomyTransaction,
  ScheduleSlot,
  DailySchedule,
  SocialInteraction,
  WorldLocation,
  WorldFact,
  WorldEvent,
  Relationship,
  RelationshipType,
  PersistenceCheckpoint,
  SchedulerTask,
  SimulationChunk,
  LogLevel,
  PADEmotions,
  MoodLabel,
} from '../engine/types';
import { useElysiumStore } from '../hooks/useElysiumStore';
import { ElysiumAPI } from '../sdk/public-api';
import { PluginManager } from '../sdk/plugin-manager';
import { BenchmarkRunner } from '../sdk/benchmarks/benchmark-runner';
import { CognitiveBenchmarks } from '../sdk/benchmarks/cognitive-benchmarks';
import type { BenchmarkSuite, ElysiumSDKStats, PluginManifest } from '../engine/types';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  cardAlt: '#111827',
  cardHover: '#1a2236',
  border: '#2a3548',
  borderHover: '#3b82f6',
  text: '#e2e8f0',
  textMid: '#94a3b8',
  textDim: '#64748b',
  accent: '#3b82f6',
  accentDim: '#1e3a5f',
  accentBright: '#60a5fa',
  positive: '#22c55e',
  negative: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#a855f7',
};

const MEMORY_TYPES: MemoryType[] = [
  'working',
  'short',
  'long',
  'semantic',
  'procedural',
  'flashbulb',
  'trauma',
];

const EMOTION_LABELS: EmotionLabel[] = [
  'joy',
  'sadness',
  'anger',
  'fear',
  'disgust',
  'surprise',
];

const NEED_TYPES: NeedType[] = [
  'hunger',
  'thirst',
  'sleep',
  'social',
  'safety',
  'esteem',
  'selfActualization',
];

const ECONOMY_ITEMS: EconomyItemType[] = [
  'food',
  'water',
  'weapon',
  'tool',
  'medicine',
  'clothing',
  'luxury',
  'material',
  'book',
];

const LOD_LEVELS: LODLevel[] = ['full', 'reduced', 'minimal', 'dormant'];

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: '#fbbf24',
  sadness: '#3b82f6',
  anger: '#ef4444',
  fear: '#a855f7',
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
  student: '#a855f7',
};

const LOD_COLORS: Record<LODLevel, string> = {
  full: '#22c55e',
  reduced: '#f59e0b',
  minimal: '#f97316',
  dormant: '#64748b',
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#64748b',
  info: '#06b6d4',
  warn: '#f59e0b',
  error: '#ef4444',
};

const TAB_IDS = [
  'event-bus',
  'memory',
  'goap',
  'pad',
  'relationship',
  'goals',
  'needs',
  'decisions',
  'performance',
  'economy',
  'schedule',
  'social',
  'world',
  'cache',
  'batch-writes',
  'persistence',
  'lod',
  'chunks',
  'scheduler',
  'sandbox',
  'export-import',
  'replay',
  'logs',
  'sdk',
  'benchmarks',
  'plugins',
] as const;

type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, string> = {
  'event-bus': 'Event Bus',
  memory: 'Memory',
  goap: 'GOAP',
  pad: 'PAD',
  relationship: 'Relationship',
  goals: 'Goals',
  needs: 'Needs',
  decisions: 'Decisions',
  performance: 'Performance',
  economy: 'Economy',
  schedule: 'Schedule',
  social: 'Social',
  world: 'World',
  cache: 'Cache',
  'batch-writes': 'Batch Writes',
  persistence: 'Persistence',
  lod: 'LOD',
  chunks: 'Chunks',
  scheduler: 'Scheduler',
  sandbox: 'Sandbox',
  'export-import': 'Export/Import',
  replay: 'Replay',
  logs: 'Logs',
  sdk: 'SDK',
  benchmarks: 'Benchmarks',
  plugins: 'Plugins',
};

const NPC_SPECIFIC_TABS: Set<TabId> = new Set<TabId>([
  'memory',
  'goap',
  'pad',
  'relationship',
  'goals',
  'needs',
  'decisions',
  'schedule',
]);

const s: Record<string, any> = {
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
    width: 200,
    minWidth: 200,
    height: '100vh',
    backgroundColor: COLORS.card,
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '14px 14px 10px',
    borderBottom: `1px solid ${COLORS.border}`,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.textDim,
  },
  sidebarSubHeader: {
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.textDim,
  },
  tabList: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 0',
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.textMid,
    borderLeft: '2px solid transparent',
    transition: 'all 0.15s ease',
  },
  tabItemHover: {
    backgroundColor: COLORS.cardHover,
    color: COLORS.text,
  },
  tabItemActive: {
    backgroundColor: COLORS.accentDim,
    color: COLORS.accent,
    borderLeft: `2px solid ${COLORS.accent}`,
    fontWeight: 600,
  },
  tabIndex: {
    fontSize: 10,
    color: COLORS.textDim,
    minWidth: 20,
    textAlign: 'right',
  },
  tabIndexActive: {
    color: COLORS.accent,
  fontWeight: 700,
  },
  main: {
    flex: 1,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.border}`,
    gap: 12,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.text,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  npcSelect: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 4,
    backgroundColor: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  panel: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: 16,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.textDim,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    backgroundColor: COLORS.accentDim,
    color: COLORS.accent,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 14,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  statCard: {
    backgroundColor: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textDim,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.text,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.text,
  },
  statValueAccent: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.accent,
  },
  statSub: {
    fontSize: 11,
    color: COLORS.textMid,
  },
  barRow: {
    marginBottom: 10,
  },
  barLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: COLORS.textMid,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  barValue: {
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
    transition: 'width 0.4s ease',
  },
  padBarTrack: {
    height: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
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
    borderRadius: 4,
    transition: 'all 0.4s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    tableLayout: 'fixed',
    marginTop: 4,
    display: 'block',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '400px',
    borderSpacing: 0,
  },
  thead: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: COLORS.cardAlt,
  borderBottom: `1px solid ${COLORS.border}`,
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.textDim,
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  td: {
    textAlign: 'left',
    padding: '6px 10px',
    fontSize: 12,
    color: COLORS.textMid,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  tdCode: {
    textAlign: 'left',
    padding: '6px 10px',
    fontSize: 11,
    color: COLORS.accent,
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  btnSecondary: {
    backgroundColor: COLORS.cardAlt,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnDanger: {
    backgroundColor: 'transparent',
    color: COLORS.negative,
    border: `1px solid ${COLORS.negative}`,
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    outline: 'none',
  },
  textarea: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    outline: 'none',
    width: '100%',
    minHeight: 200,
    resize: 'vertical',
    lineHeight: 1.5,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    color: COLORS.textDim,
    textAlign: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textDim,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  rowBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollList: {
    maxHeight: 420,
    overflowY: 'auto',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.cardAlt,
  },
  listItem: {
    padding: '8px 12px',
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
  },
  listItemHover: {
    backgroundColor: COLORS.cardHover,
  },
  mono: {
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: 11,
  },
  sparkline: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 1,
    height: 24,
  },
  sparkBar: {
    flex: 1,
    minWidth: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
    opacity: 0.7,
  },
  graphContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  checkbox: {
    cursor: 'pointer',
    accentColor: COLORS.accent,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    transition: 'all 0.15s ease',
  },
  filterChipActive: {
    backgroundColor: COLORS.accentDim,
    color: COLORS.accent,
    borderColor: COLORS.accent,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    margin: '12px 0',
  },
  codeBlock: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 10,
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: 11,
    color: COLORS.textMid,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: 200,
    overflowY: 'auto',
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.4s ease',
  },
  gridViz: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 3,
    marginTop: 8,
  },
  gridCell: {
    aspectRatio: '1',
    borderRadius: 4,
    border: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textDim,
    cursor: 'default',
    transition: 'all 0.2s ease',
  },
  label: {
    fontSize: 11,
    color: COLORS.textMid,
    fontWeight: 500,
  },
  selectWrap: {
    position: 'relative',
    display: 'inline-block',
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  muted: {
    color: COLORS.textDim,
  },
  positive: {
    color: COLORS.positive,
  },
  negative: {
    color: COLORS.negative,
  },
  warning: {
    color: COLORS.warning,
  },
  accent: {
    color: COLORS.accent,
  },
  monoSmall: {
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: 10,
    color: COLORS.textDim,
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    backgroundColor: COLORS.cardAlt,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    fontSize: 12,
  },
  actionArrow: {
    color: COLORS.textDim,
    fontSize: 14,
  },
  factorBar: {
    height: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 3,
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  padHistoryGraph: {
    height: 80,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
    position: 'relative',
    padding: 4,
  },
  padHistoryLine: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 1,
  },
  slotTimeline: {
    display: 'flex',
    gap: 2,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    border: `1px solid ${COLORS.border}`,
  },
  slotBlock: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.text,
    cursor: 'default',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 2px',
  },
  slotBlockActive: {
    boxShadow: `inset 0 0 0 2px ${COLORS.accent}`,
  },
  weatherIcon: {
    fontSize: 20,
  marginRight: 6,
  verticalAlign: 'middle',
  display: 'inline-block',
  width: 24,
    textAlign: 'center',
  color: COLORS.accent,
  fontWeight: 700,
  backgroundColor: COLORS.cardAlt,
    borderRadius: 4,
    height: 24,
    lineHeight: '24px',
  },
};

function formatTime(ts: number): string {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function formatRelative(ts: number): string {
  if (!ts) return '--';
  const diff = Date.now() - ts;
  if (diff < 1000) return diff + 'ms ago';
  if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  return Math.floor(diff / 3600000) + 'h ago';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function Bar({ value, max, color, height }: { value: number; max: number; color: string; height?: number }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div style={{ ...s.barTrack, height: height ?? 6 }}>
      <div style={{ ...s.barFill, width: pct + '%', backgroundColor: color }} />
    </div>
  );
}

function PADBar({ value, color }: { value: number; color: string }) {
  const pct = clamp(Math.abs(value) * 50, 0, 50);
  const isPositive = value >= 0;
  return (
    <div style={s.padBarTrack}>
      <div style={s.padBarCenter} />
      <div
        style={{
          ...s.padBarFill,
          width: pct + '%',
          backgroundColor: color,
          left: isPositive ? '50%' : undefined,
          right: isPositive ? undefined : '50%',
        }}
      />
    </div>
  );
}

function Sparkline({ data, color, height }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length === 0) return <span style={s.muted}>--</span>;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const h = height ?? 24;
  return (
    <div style={{ ...s.sparkline, height: h }}>
      {data.slice(-30).map((v, i) => {
        const norm = (v - min) / range;
        return (
          <div
            key={i}
            style={{
              ...s.sparkBar,
              height: Math.max(2, norm * h) + 'px',
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={accent ? s.statValueAccent : s.statValue}>{value}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={s.emptyState}>
      <div style={s.emptyIcon}>○</div>
      <div style={s.emptyText}>{message}</div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ ...s.badge, backgroundColor: color + '22', color }}>
      {text}
    </span>
  );
}

function NPCSelector({ npcs, selectedNPCId, onSelect }: { npcs: NPCCore[]; selectedNPCId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <select
      style={s.npcSelect}
      value={selectedNPCId ?? ''}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">-- Select NPC --</option>
      {npcs.map((npc) => (
        <option key={npc.id} value={npc.id}>
          {npc.name} ({npc.id})
        </option>
      ))}
    </select>
  );
}

export default function DeveloperTools() {
  const store = useElysiumStore();
  const [activeTab, setActiveTab] = useState<TabId>('event-bus');
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(store.npcs[0]?.id ?? null);

  const selectedNPC = useMemo(
    () => store.npcs.find((n) => n.id === selectedNPCId) ?? null,
    [store.npcs, selectedNPCId],
  );

  const handleTabClick = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const needsNPC = NPC_SPECIFIC_TABS.has(activeTab);

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>Developer Tools</div>
        <div style={s.sidebarSubHeader}>Inspectors ({TAB_IDS.length})</div>
        <div style={s.tabList}>
          {TAB_IDS.map((tabId, idx) => {
            const isActive = activeTab === tabId;
            return (
              <div
                key={tabId}
                style={{
                  ...s.tabItem,
                  ...(isActive ? s.tabItemActive : {}),
                }}
                onClick={() => handleTabClick(tabId)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = COLORS.cardHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ ...s.tabIndex, ...(isActive ? s.tabIndexActive : {}) }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{TAB_LABELS[tabId]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.main}>
        <div style={s.topBar}>
          <div style={s.topBarLeft}>
            <div style={s.topBarTitle}>{TAB_LABELS[activeTab]}</div>
            {needsNPC && (
              <Badge text="NPC-Specific" color={COLORS.accent} />
            )}
          </div>
          <div style={s.topBarRight}>
            {needsNPC && (
              <NPCSelector
                npcs={store.npcs}
                selectedNPCId={selectedNPCId}
                onSelect={setSelectedNPCId}
              />
            )}
            <div style={{ ...s.statusBadge, borderColor: store.isRunning ? COLORS.positive : COLORS.border }}>
              <div style={{ ...s.statusDot, backgroundColor: store.isRunning ? COLORS.positive : COLORS.textDim }} />
              <span style={{ color: store.isRunning ? COLORS.positive : COLORS.textDim }}>
                {store.isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div style={s.statusBadge}>
              <span style={s.muted}>Tick:</span>
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>{store.tickCount}</span>
            </div>
            <div style={s.statusBadge}>
              <span style={s.muted}>NPCs:</span>
              <span style={{ color: COLORS.text, fontWeight: 700 }}>{store.npcs.length}</span>
            </div>
          </div>
        </div>

        <div style={s.content}>
          {activeTab === 'event-bus' && <EventBusTab events={store.events} onClear={store.clearEvents} />}
          {activeTab === 'memory' && <MemoryTab npc={selectedNPC} />}
          {activeTab === 'goap' && <GOAPTab npc={selectedNPC} runtime={store.runtime} />}
          {activeTab === 'pad' && <PADTab npc={selectedNPC} />}
          {activeTab === 'relationship' && <RelationshipTab npc={selectedNPC} npcs={store.npcs} runtime={store.runtime} />}
          {activeTab === 'goals' && <GoalsTab npc={selectedNPC} />}
          {activeTab === 'needs' && <NeedsTab npc={selectedNPC} />}
          {activeTab === 'decisions' && <DecisionsTab npc={selectedNPC} />}
          {activeTab === 'performance' && <PerformanceTab perfStats={store.perfStats} runtime={store.runtime} />}
          {activeTab === 'economy' && <EconomyTab npcs={store.npcs} runtime={store.runtime} />}
          {activeTab === 'schedule' && <ScheduleTab npc={selectedNPC} worldState={store.worldState} />}
          {activeTab === 'social' && <SocialTab npcs={store.npcs} gossip={store.gossip} factions={store.factions} runtime={store.runtime} />}
          {activeTab === 'world' && <WorldTab worldState={store.worldState} runtime={store.runtime} />}
          {activeTab === 'cache' && <CacheTab cacheStats={store.cacheStats} />}
          {activeTab === 'batch-writes' && <BatchWritesTab batchStats={store.batchStats} runtime={store.runtime} />}
          {activeTab === 'persistence' && <PersistenceTab persistStats={store.persistStats} runtime={store.runtime} />}
          {activeTab === 'lod' && <LODTab lodStats={store.lodStats} npcs={store.npcs} />}
          {activeTab === 'chunks' && <ChunksTab chunkStats={store.chunkStats} runtime={store.runtime} />}
          {activeTab === 'scheduler' && <SchedulerTab schedStats={store.schedStats} />}
          {activeTab === 'sandbox' && <SandboxTab store={store} selectedNPCId={selectedNPCId} setSelectedNPCId={setSelectedNPCId} />}
          {activeTab === 'export-import' && <ExportImportTab store={store} />}
          {activeTab === 'replay' && <ReplayTab store={store} />}
          {activeTab === 'logs' && <LogsTab logs={store.logs} onClear={store.clearLogs} />}
          {activeTab === 'sdk' && <SDKTab runtime={store.runtime} />}
          {activeTab === 'benchmarks' && <BenchmarksTab />}
          {activeTab === 'plugins' && <PluginsTab runtime={store.runtime} />}
        </div>
      </div>
    </div>
  );
}

function EventBusTab({ events, onClear }: { events: CognitiveEvent[]; onClear: () => void }) {
  const [filterType, setFilterType] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((e) => types.add(e.type));
    return Array.from(types).sort();
  }, [events]);

  const filtered = useMemo(() => {
    if (!filterType) return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filtered, autoScroll]);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Event Bus Inspector</span>
          <span style={s.panelBadge}>{filtered.length} events</span>
        </div>
        <div style={s.filterRow}>
          <select
            style={s.input}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types ({events.length})</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label style={{ ...s.inline, cursor: 'pointer', fontSize: 12, color: COLORS.textMid }}>
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={s.checkbox} />
            Auto-scroll
          </label>
          <button style={s.btnSecondary} onClick={onClear}>Clear</button>
        </div>
        <div ref={listRef} style={{ ...s.scrollList, maxHeight: 560 }}>
          {filtered.length === 0 ? (
            <EmptyState message="No events recorded" />
          ) : (
            filtered.map((event) => (
              <div key={event.id} style={s.listItem}>
                <span style={{ ...s.monoSmall, color: COLORS.textDim, minWidth: 90 }}>{formatTime(event.timestamp)}</span>
                <Badge text={event.type} color={COLORS.accent} />
                <span style={{ ...s.monoSmall, color: COLORS.textMid }}>{event.source}</span>
                {event.npcId && (
                  <span style={{ ...s.monoSmall, color: COLORS.purple }}>npc:{event.npcId}</span>
                )}
                {event.data && (
                  <span style={{ ...s.monoSmall, color: COLORS.textDim, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {JSON.stringify(event.data).slice(0, 120)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function MemoryTab({ npc }: { npc: NPCCore | null }) {
  if (!npc) return <EmptyState message="Select an NPC to view memories" />;

  const memoryCounts = MEMORY_TYPES.map((type) => ({
    type,
    records: npc.memories[type] ?? [],
  }));

  const totalMemories = memoryCounts.reduce((sum, m) => sum + m.records.length, 0);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Memory System — {npc.name}</span>
          <span style={s.panelBadge}>{totalMemories} total</span>
        </div>
        <div style={s.grid4}>
          {memoryCounts.map(({ type, records }) => (
            <StatCard
              key={type}
              label={type}
              value={records.length}
              sub={records.length > 0 ? `avg imp ${(records.reduce((s2, r) => s2 + r.importance, 0) / records.length).toFixed(2)}` : 'empty'}
            />
          ))}
        </div>
      </div>

      {memoryCounts.map(({ type, records }) => (
        <div key={type} style={s.panel}>
          <div style={s.panelTitle}>
            <span>{type} memories</span>
            <span style={s.panelBadge}>{records.length}</span>
          </div>
          {records.length === 0 ? (
            <EmptyState message={`No ${type} memories`} />
          ) : (
            <div style={s.scrollList}>
              {records.map((mem: MemoryRecord) => (
                <div key={mem.id} style={s.listItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 4 }}>{mem.content}</div>
                    <div style={s.inline}>
                      <span style={s.monoSmall}>imp: <span style={{ color: COLORS.accent }}>{mem.importance.toFixed(2)}</span></span>
                      <span style={s.monoSmall}>decay: <span style={{ color: COLORS.warning }}>{mem.decayRate.toFixed(3)}</span></span>
                      <span style={s.monoSmall}>emo: <span style={{ color: COLORS.purple }}>{mem.emotionalWeight.toFixed(2)}</span></span>
                      <span style={s.monoSmall}>access: <span style={{ color: COLORS.text }}>{mem.accessCount}</span></span>
                      <span style={s.monoSmall}>{formatRelative(mem.lastAccessed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function GOAPTab({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  const actionLibrary = useMemo(() => {
    try {
      return runtime.goapPlanner.getActionLibrary() as GOAPAction[];
    } catch {
      return [];
    }
  }, [runtime]);

  const cacheSize = useMemo(() => {
    try {
      return (runtime.goapPlanner.planCache as Map<string, GOAPPlan>)?.size ?? 0;
    } catch {
      return 0;
    }
  }, [runtime]);

  if (!npc) return <EmptyState message="Select an NPC to view GOAP state" />;

  const plan = npc.currentPlan;
  const goal = npc.currentGoal;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>GOAP Plan — {npc.name}</span>
          {plan && <Badge text={plan.found ? 'FOUND' : 'FAILED'} color={plan.found ? COLORS.positive : COLORS.negative} />}
          {plan?.cached && <Badge text="CACHED" color={COLORS.warning} />}
        </div>
        {!goal ? (
          <EmptyState message="No active goal" />
        ) : (
          <>
            <div style={{ ...s.statCard, marginBottom: 12 }}>
              <div style={s.statLabel}>Current Goal</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{goal.name}</div>
              <div style={s.statSub}>Priority: {goal.priority}</div>
            </div>
            {plan && plan.actions.length > 0 && (
              <div>
                <div style={s.sectionTitle}>Plan Actions (total cost: {plan.totalCost.toFixed(1)})</div>
                <div style={s.actionList}>
                  {plan.actions.map((action, idx) => (
                    <div key={idx} style={s.actionItem}>
                      <span style={{ ...s.badge, backgroundColor: COLORS.accentDim, color: COLORS.accent }}>{idx + 1}</span>
                      <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{action.name}</span>
                      <span style={{ ...s.monoSmall, color: COLORS.warning }}>cost: {action.cost}</span>
                      {action.target && <span style={{ ...s.monoSmall, color: COLORS.purple }}>→ {action.target}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan && !plan.found && (
              <div style={{ ...s.codeBlock, color: COLORS.negative }}>
                Plan could not be found for goal "{goal.name}"
              </div>
            )}
          </>
        )}
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Action Library</span>
          <span style={s.panelBadge}>{actionLibrary.length} actions</span>
        </div>
        <div style={s.scrollList}>
          {actionLibrary.map((action, idx) => (
            <div key={idx} style={s.listItem}>
              <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{action.name}</span>
              <span style={{ ...s.monoSmall, color: COLORS.warning }}>cost: {action.cost}</span>
              <span style={{ ...s.monoSmall, color: COLORS.textDim }}>
                {Object.keys(action.preconditions).length} pre / {Object.keys(action.effects).length} eff
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Plan Cache Stats</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Cached Plans" value={cacheSize} accent />
          <StatCard label="Current Plan" value={plan ? 'Active' : 'None'} />
          <StatCard label="Goal Status" value={goal ? 'Set' : 'Idle'} />
        </div>
      </div>
    </>
  );
}

function PADTab({ npc }: { npc: NPCCore | null }) {
  const [history, setHistory] = useState<{ t: number; pad: PADEmotions }[]>([]);

  useEffect(() => {
    if (!npc) {
      setHistory([]);
      return;
    }
    setHistory((prev) => {
      const next = [...prev, { t: Date.now(), pad: { ...npc.emotions.pad } }];
      return next.slice(-60);
    });
  }, [npc, npc?.emotions.pad.pleasure, npc?.emotions.pad.arousal, npc?.emotions.pad.dominance]);

  if (!npc) return <EmptyState message="Select an NPC to view PAD emotions" />;

  const { pad, emotions, mood } = npc.emotions;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>PAD Emotion — {npc.name}</span>
          <Badge text={mood} color={MOOD_COLORS[mood]} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={s.barLabel}>
              <span>Pleasure</span>
              <span style={s.barValue}>{pad.pleasure.toFixed(3)}</span>
            </div>
            <PADBar value={pad.pleasure} color={COLORS.positive} />
          </div>
          <div>
            <div style={s.barLabel}>
              <span>Arousal</span>
              <span style={s.barValue}>{pad.arousal.toFixed(3)}</span>
            </div>
            <PADBar value={pad.arousal} color={COLORS.warning} />
          </div>
          <div>
            <div style={s.barLabel}>
              <span>Dominance</span>
              <span style={s.barValue}>{pad.dominance.toFixed(3)}</span>
            </div>
            <PADBar value={pad.dominance} color={COLORS.accent} />
          </div>
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Discrete Emotions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EMOTION_LABELS.map((label) => {
            const val = emotions[label] ?? 0;
            return (
              <div key={label}>
                <div style={s.barLabel}>
                  <span style={{ textTransform: 'capitalize' }}>{label}</span>
                  <span style={s.barValue}>{val.toFixed(3)}</span>
                </div>
                <Bar value={val} max={1} color={EMOTION_COLORS[label]} height={8} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>PAD History</span>
          <span style={s.panelBadge}>{history.length} samples</span>
        </div>
        <div style={s.padHistoryGraph}>
          {history.length === 0 ? (
            <div style={{ ...s.emptyState, height: '100%' }}>
              <div style={s.emptyText}>Collecting history...</div>
            </div>
          ) : (
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke={COLORS.border} strokeWidth="1" />
              {history.map((h, i) => {
                const x = (i / Math.max(history.length - 1, 1)) * 100;
                const yP = 50 - (h.pad.pleasure * 40);
                const yA = 50 - (h.pad.arousal * 40);
                const yD = 50 - (h.pad.dominance * 40);
                return (
                  <g key={i}>
                    <circle cx={x + '%'} cy={yP + '%'} r="1.5" fill={COLORS.positive} />
                    <circle cx={x + '%'} cy={yA + '%'} r="1.5" fill={COLORS.warning} />
                    <circle cx={x + '%'} cy={yD + '%'} r="1.5" fill={COLORS.accent} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div style={{ ...s.inline, marginTop: 8, justifyContent: 'center' }}>
          <span style={{ ...s.inline, fontSize: 10, color: COLORS.positive }}>● Pleasure</span>
          <span style={{ ...s.inline, fontSize: 10, color: COLORS.warning }}>● Arousal</span>
          <span style={{ ...s.inline, fontSize: 10, color: COLORS.accent }}>● Dominance</span>
        </div>
      </div>
    </>
  );
}

function RelationshipTab({ npc, npcs, runtime }: { npc: NPCCore | null; npcs: NPCCore[]; runtime: any }) {
  const graphStats = useMemo(() => {
    try {
      return runtime.relationshipGraph.getGraphStats();
    } catch {
      return { totalRelationships: 0, avgTrust: 0, avgAffinity: 0 };
    }
  }, [runtime, npc]);

  if (!npc) return <EmptyState message="Select an NPC to view relationships" />;

  const relationships = Object.values(npc.relationships);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Relationship Graph — {npc.name}</span>
          <span style={s.panelBadge}>{relationships.length} relationships</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Relationships" value={relationships.length} accent />
          <StatCard label="Avg Trust" value={graphStats.avgTrust?.toFixed(1) ?? '--'} />
          <StatCard label="Avg Affinity" value={graphStats.avgAffinity?.toFixed(1) ?? '--'} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Relationships</span>
        </div>
        {relationships.length === 0 ? (
          <EmptyState message="No relationships established" />
        ) : (
          <div style={s.scrollList}>
            {relationships.map((rel: Relationship) => {
              const targetNPC = npcs.find((n) => n.id === rel.npcId);
              return (
                <div key={rel.npcId} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <div style={s.rowBetween}>
                    <div style={s.inline}>
                      <span style={{ color: COLORS.text, fontWeight: 600 }}>{targetNPC?.name ?? rel.npcId}</span>
                      <Badge text={rel.type} color={RELATIONSHIP_COLORS[rel.type]} />
                    </div>
                    <span style={s.monoSmall}>familiarity: {rel.familiarity.toFixed(1)}</span>
                  </div>
                  <div>
                    <div style={s.barLabel}>
                      <span>Trust</span>
                      <span style={s.barValue}>{rel.trust.toFixed(1)}</span>
                    </div>
                    <Bar value={rel.trust} max={100} color={rel.trust >= 0 ? COLORS.positive : COLORS.negative} height={5} />
                  </div>
                  <div>
                    <div style={s.barLabel}>
                      <span>Affinity</span>
                      <span style={s.barValue}>{rel.affinity.toFixed(1)}</span>
                    </div>
                    <Bar value={rel.affinity} max={100} color={rel.affinity >= 0 ? COLORS.accent : COLORS.negative} height={5} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function GoalsTab({ npc }: { npc: NPCCore | null }) {
  if (!npc) return <EmptyState message="Select an NPC to view goals" />;

  const goal = npc.currentGoal;
  const plan = npc.currentPlan;

  return (
    <div style={s.panel}>
      <div style={s.panelTitle}>
        <span>Goal Inspector — {npc.name}</span>
        {goal && <Badge text="ACTIVE" color={COLORS.positive} />}
      </div>
      {!goal ? (
        <EmptyState message="No active goal" />
      ) : (
        <>
          <div style={s.grid3}>
            <StatCard label="Goal Name" value={goal.name} />
            <StatCard label="Priority" value={goal.priority} accent />
            <StatCard label="Plan Found" value={plan?.found ? 'Yes' : 'No'} />
          </div>
          <div style={s.divider} />
          <div style={s.sectionTitle}>Target State</div>
          <div style={s.codeBlock}>
            {JSON.stringify(goal.targetState, null, 2)}
          </div>
          {plan && plan.actions.length > 0 && (
            <>
              <div style={s.sectionTitle}>GOAP Plan (cost: {plan.totalCost.toFixed(1)})</div>
              <div style={s.actionList}>
                {plan.actions.map((action, idx) => (
                  <div key={idx} style={s.actionItem}>
                    <span style={{ ...s.badge, backgroundColor: COLORS.accentDim, color: COLORS.accent }}>{idx + 1}</span>
                    <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{action.name}</span>
                    <span style={{ ...s.monoSmall, color: COLORS.warning }}>cost: {action.cost}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function NeedsTab({ npc }: { npc: NPCCore | null }) {
  const [history, setHistory] = useState<{ t: number; needs: Record<string, number> }[]>([]);

  useEffect(() => {
    if (!npc) {
      setHistory([]);
      return;
    }
    setHistory((prev) => {
      const next = [...prev, { t: Date.now(), needs: { ...npc.needs } }];
      return next.slice(-40);
    });
  }, [npc, npc?.needs.hunger, npc?.needs.thirst, npc?.needs.sleep, npc?.needs.social, npc?.needs.safety, npc?.needs.esteem, npc?.needs.selfActualization]);

  if (!npc) return <EmptyState message="Select an NPC to view needs" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Needs — {npc.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {NEED_TYPES.map((need) => {
            const val = npc.needs[need] ?? 0;
            const color = val < 30 ? COLORS.negative : val < 60 ? COLORS.warning : COLORS.positive;
            return (
              <div key={need}>
                <div style={s.barLabel}>
                  <span style={{ textTransform: 'capitalize' }}>{need}</span>
                  <span style={s.barValue}>{val.toFixed(1)}</span>
                </div>
                <Bar value={val} max={100} color={color} height={8} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Need Change History</span>
          <span style={s.panelBadge}>{history.length} samples</span>
        </div>
        {history.length < 2 ? (
          <EmptyState message="Collecting history..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NEED_TYPES.map((need) => {
              const values = history.map((h) => h.needs[need] ?? 0);
              const color = need === 'hunger' ? COLORS.warning : need === 'thirst' ? COLORS.info : need === 'sleep' ? COLORS.purple : need === 'social' ? COLORS.accent : need === 'safety' ? COLORS.positive : need === 'esteem' ? COLORS.negative : COLORS.textMid;
              return (
                <div key={need}>
                  <div style={s.barLabel}>
                    <span style={{ textTransform: 'capitalize' }}>{need}</span>
                  </div>
                  <Sparkline data={values} color={color} height={28} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function DecisionsTab({ npc }: { npc: NPCCore | null }) {
  if (!npc) return <EmptyState message="Select an NPC to view decisions" />;

  const decisions = npc.decisionHistory;

  return (
    <div style={s.panel}>
      <div style={s.panelTitle}>
        <span>Decision History — {npc.name}</span>
        <span style={s.panelBadge}>{decisions.length} decisions</span>
      </div>
      {decisions.length === 0 ? (
        <EmptyState message="No decisions recorded" />
      ) : (
        <div style={s.scrollList}>
          {decisions.map((dec: UtilityDecision, idx) => (
            <div key={idx} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <div style={s.rowBetween}>
                <div style={s.inline}>
                  <span style={{ color: COLORS.text, fontWeight: 600 }}>{dec.action}</span>
                  {dec.isCriticalOverride && <Badge text="CRITICAL" color={COLORS.negative} />}
                </div>
                <div style={s.inline}>
                  <span style={{ ...s.monoSmall, color: COLORS.accent }}>score: {dec.score.toFixed(3)}</span>
                  <span style={s.monoSmall}>{formatRelative(dec.timestamp)}</span>
                </div>
              </div>
              {dec.factors && Object.keys(dec.factors).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(dec.factors).map(([fname, fval]) => (
                    <div key={fname}>
                      <div style={s.barLabel}>
                        <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{fname}</span>
                        <span style={{ ...s.barValue, fontSize: 10 }}>{(fval as number).toFixed(3)}</span>
                      </div>
                      <div style={s.factorBar}>
                        <div style={{ ...s.factorBarFill, width: clamp((fval as number) * 100, 0, 100) + '%', backgroundColor: COLORS.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerformanceTab({ perfStats, runtime }: { perfStats: PerformanceStats | null; runtime: any }) {
  const tickTimes = useMemo(() => {
    try {
      return [...runtime.tickTimes] as number[];
    } catch {
      return [];
    }
  }, [runtime, perfStats]);

  if (!perfStats) return <EmptyState message="No performance data available" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Performance Monitor</span>
          <span style={s.panelBadge}>tick #{perfStats.tickCount}</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Tick Count" value={perfStats.tickCount} accent />
          <StatCard label="Active NPCs" value={perfStats.activeNPCs} />
          <StatCard label="Total Events" value={perfStats.totalEvents} />
          <StatCard label="Last Tick" value={perfStats.lastTickMs.toFixed(1) + 'ms'} />
          <StatCard label="Avg Tick" value={perfStats.avgTickMs.toFixed(1) + 'ms'} />
          <StatCard label="Max Tick" value={perfStats.maxTickMs.toFixed(1) + 'ms'} sub={perfStats.maxTickMs > 100 ? '⚠ slow' : 'healthy'} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Tick Time Graph</span>
          <span style={s.panelBadge}>{tickTimes.length} samples</span>
        </div>
        {tickTimes.length === 0 ? (
          <EmptyState message="No tick data yet" />
        ) : (
          <div style={{ height: 140, backgroundColor: COLORS.cardAlt, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden', padding: 4 }}>
            <svg width="100%" height="100%" style={{ display: 'block' }}>
              {tickTimes.map((t, i) => {
                const x = (i / Math.max(tickTimes.length - 1, 1)) * 100;
                const maxT = Math.max(...tickTimes, 1);
                const h = (t / maxT) * 100;
                const color = t > 100 ? COLORS.negative : t > 50 ? COLORS.warning : COLORS.positive;
                return (
                  <rect
                    key={i}
                    x={x + '%'}
                    y={100 - h + '%'}
                    width={Math.max(1, 100 / tickTimes.length - 0.5) + '%'}
                    height={h + '%'}
                    fill={color}
                    rx="1"
                  />
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </>
  );
}

function EconomyTab({ npcs, runtime }: { npcs: NPCCore[]; runtime: any }) {
  const [inventory, setInventory] = useState<Record<string, EconomyItem> | null>(null);
  const [transactions, setTransactions] = useState<EconomyTransaction[]>([]);

  useEffect(() => {
    try {
      setInventory(runtime.economyEngine.getInventory());
      setTransactions(runtime.economyEngine.getTransactions());
    } catch {
      /* noop */
    }
    const interval = setInterval(() => {
      try {
        setInventory(runtime.economyEngine.getInventory());
        setTransactions(runtime.economyEngine.getTransactions());
      } catch {
        /* noop */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [runtime]);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Economy Inspector — Item Prices</span>
          <span style={s.panelBadge}>{ECONOMY_ITEMS.length} item types</span>
        </div>
        {!inventory ? (
          <EmptyState message="No economy data" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Base Price</th>
                  <th style={s.th}>Current</th>
                  <th style={s.th}>Supply</th>
                  <th style={s.th}>Demand</th>
                  <th style={s.th}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {ECONOMY_ITEMS.map((itemType) => {
                  const item = inventory[itemType];
                  if (!item) return null;
                  const priceDiff = item.currentPrice - item.basePrice;
                  const trendColor = priceDiff > 0 ? COLORS.positive : priceDiff < 0 ? COLORS.negative : COLORS.textDim;
                  return (
                    <tr key={itemType} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...s.td, color: COLORS.text, fontWeight: 600, textTransform: 'capitalize' }}>{itemType}</td>
                      <td style={s.td}>{item.basePrice.toFixed(1)}</td>
                      <td style={{ ...s.td, color: trendColor, fontWeight: 600 }}>{item.currentPrice.toFixed(1)}</td>
                      <td style={s.td}>{item.supply}</td>
                      <td style={s.td}>{item.demand}</td>
                      <td style={s.td}>
                        <Sparkline data={item.priceHistory} color={trendColor} height={20} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>NPC Wallets</span>
        </div>
        <div style={s.grid4}>
          {npcs.map((npc) => (
            <StatCard key={npc.id} label={npc.name} value={npc.wallet.toFixed(0) + 'g'} accent />
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Recent Transactions</span>
          <span style={s.panelBadge}>{transactions.length}</span>
        </div>
        {transactions.length === 0 ? (
          <EmptyState message="No transactions yet" />
        ) : (
          <div style={s.scrollList}>
            {transactions.slice(-20).reverse().map((tx) => (
              <div key={tx.id} style={s.listItem}>
                <span style={{ ...s.monoSmall, color: COLORS.textDim, minWidth: 80 }}>{formatTime(tx.timestamp)}</span>
                <span style={{ color: COLORS.text, fontWeight: 600, textTransform: 'capitalize' }}>{tx.itemType}</span>
                <span style={s.monoSmall}>x{tx.quantity}</span>
                <span style={{ ...s.monoSmall, color: COLORS.warning }}>{tx.totalPrice.toFixed(1)}g</span>
                <span style={{ ...s.monoSmall, color: COLORS.purple }}>{tx.buyerId} ← {tx.sellerId}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ScheduleTab({ npc, worldState }: { npc: NPCCore | null; worldState: WorldState | null }) {
  if (!npc) return <EmptyState message="Select an NPC to view schedule" />;
  const schedule = npc.schedule;
  if (!schedule) return <EmptyState message="No schedule generated" />;

  const currentHour = worldState?.hour ?? 0;
  const currentSlot = schedule.slots[schedule.currentSlotIndex];

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Schedule Inspector — {npc.name}</span>
          <span style={s.panelBadge}>Day {schedule.day}</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Current Hour" value={String(currentHour)} accent />
          <StatCard label="Current Slot" value={currentSlot?.activity ?? 'None'} />
          <StatCard label="Total Slots" value={schedule.slots.length} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Daily Timeline</span>
        </div>
        <div style={s.slotTimeline}>
          {schedule.slots.map((slot, idx) => {
            const isActive = idx === schedule.currentSlotIndex;
            const color = isActive ? COLORS.accent : COLORS.cardAlt;
            return (
              <div
                key={slot.id}
                style={{
                  ...s.slotBlock,
                  backgroundColor: color,
                  ...(isActive ? s.slotBlockActive : {}),
                }}
                title={`${slot.activity} (${slot.startHour}:00-${slot.endHour}:00) @ ${slot.location}`}
              >
                {slot.activity.slice(0, 4)}
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Schedule Slots</span>
        </div>
        <div style={s.scrollList}>
          {schedule.slots.map((slot, idx) => {
            const isActive = idx === schedule.currentSlotIndex;
            return (
              <div key={slot.id} style={{ ...s.listItem, backgroundColor: isActive ? COLORS.accentDim : undefined }}>
                <span style={{ ...s.badge, backgroundColor: isActive ? COLORS.accent : COLORS.cardAlt, color: isActive ? '#fff' : COLORS.textDim }}>
                  {slot.startHour}:00-{slot.endHour}:00
                </span>
                <span style={{ flex: 1, color: COLORS.text, fontWeight: isActive ? 700 : 500 }}>{slot.activity}</span>
                <span style={{ ...s.monoSmall, color: COLORS.purple }}>{slot.location}</span>
                <span style={{ ...s.monoSmall, color: COLORS.warning }}>P:{slot.priority}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SocialTab({ npcs, gossip, factions, runtime }: { npcs: NPCCore[]; gossip: GossipItem[]; factions: Faction[]; runtime: any }) {
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);

  useEffect(() => {
    try {
      setInteractions(runtime.socialSimulation.getInteractions());
    } catch {
      /* noop */
    }
    const interval = setInterval(() => {
      try {
        setInteractions(runtime.socialSimulation.getInteractions());
      } catch {
        /* noop */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [runtime]);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Recent Social Interactions</span>
          <span style={s.panelBadge}>{interactions.length}</span>
        </div>
        {interactions.length === 0 ? (
          <EmptyState message="No social interactions yet" />
        ) : (
          <div style={s.scrollList}>
            {interactions.slice(-30).reverse().map((inter) => {
              const initName = npcs.find((n) => n.id === inter.initiatorId)?.name ?? inter.initiatorId;
              const targetName = npcs.find((n) => n.id === inter.targetId)?.name ?? inter.targetId;
              const outcomeColor = inter.outcome === 'positive' ? COLORS.positive : inter.outcome === 'negative' ? COLORS.negative : COLORS.textDim;
              return (
                <div key={inter.id} style={s.listItem}>
                  <span style={{ ...s.monoSmall, color: COLORS.textDim, minWidth: 80 }}>{formatTime(inter.timestamp)}</span>
                  <Badge text={inter.type} color={COLORS.accent} />
                  <span style={{ color: COLORS.text }}>{initName} → {targetName}</span>
                  <span style={{ color: outcomeColor, fontWeight: 600 }}>{inter.outcome}</span>
                  <span style={{ ...s.monoSmall, color: inter.trustDelta >= 0 ? COLORS.positive : COLORS.negative }}>
                    {inter.trustDelta >= 0 ? '+' : ''}{inter.trustDelta.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Factions</span>
          <span style={s.panelBadge}>{factions.length}</span>
        </div>
        {factions.length === 0 ? (
          <EmptyState message="No factions formed" />
        ) : (
          <div style={s.scrollList}>
            {factions.map((faction) => (
              <div key={faction.id} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={s.rowBetween}>
                  <span style={{ color: COLORS.text, fontWeight: 600 }}>{faction.name}</span>
                  <span style={s.monoSmall}>{faction.memberIds.length} members</span>
                </div>
                <div>
                  <div style={s.barLabel}>
                    <span>Reputation</span>
                    <span style={s.barValue}>{faction.reputation.toFixed(1)}</span>
                  </div>
                  <Bar value={faction.reputation} max={100} color={faction.reputation >= 0 ? COLORS.positive : COLORS.negative} height={5} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Active Gossip</span>
          <span style={s.panelBadge}>{gossip.length}</span>
        </div>
        {gossip.length === 0 ? (
          <EmptyState message="No active gossip" />
        ) : (
          <div style={s.scrollList}>
            {gossip.map((g) => {
              const aboutName = npcs.find((n) => n.id === g.aboutNPCId)?.name ?? g.aboutNPCId;
              const originName = npcs.find((n) => n.id === g.originatorId)?.name ?? g.originatorId;
              return (
                <div key={g.id} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                  <div style={s.rowBetween}>
                    <span style={{ color: COLORS.text, fontWeight: 600 }}>{g.topic}</span>
                    <span style={s.monoSmall}>{formatRelative(g.timestamp)}</span>
                  </div>
                  <div style={s.inline}>
                    <span style={s.monoSmall}>about: <span style={{ color: COLORS.purple }}>{aboutName}</span></span>
                    <span style={s.monoSmall}>from: <span style={{ color: COLORS.accent }}>{originName}</span></span>
                    <span style={s.monoSmall}>spread: {g.spreadTo.length}</span>
                  </div>
                  <div>
                    <div style={s.barLabel}>
                      <span>Truth</span>
                      <span style={s.barValue}>{g.truth.toFixed(2)}</span>
                    </div>
                    <Bar value={g.truth} max={1} color={g.truth > 0.5 ? COLORS.positive : COLORS.warning} height={4} />
                  </div>
                  <div>
                    <div style={s.barLabel}>
                      <span>Decay Rate</span>
                      <span style={s.barValue}>{g.decayRate.toFixed(3)}</span>
                    </div>
                    <Bar value={g.decayRate} max={0.1} color={COLORS.negative} height={4} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function WorldTab({ worldState, runtime }: { worldState: WorldState | null; runtime: any }) {
  const [facts, setFacts] = useState<WorldFact[]>([]);
  const [activeEvents, setActiveEvents] = useState<WorldEvent[]>([]);
  const [locations, setLocations] = useState<WorldLocation[]>([]);

  useEffect(() => {
    const refresh = () => {
      try {
        setFacts(runtime.worldKnowledge.getFacts());
        setActiveEvents(runtime.worldKnowledge.getActiveEvents());
        setLocations(runtime.worldKnowledge.getLocations());
      } catch {
        /* noop */
      }
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [runtime]);

  if (!worldState) return <EmptyState message="No world state available" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>World Cycle</span>
        </div>
        <div style={s.grid4}>
          <StatCard label="Day" value={worldState.day} accent />
          <StatCard label="Hour" value={String(worldState.hour) + ':00'} />
          <StatCard label="Season" value={worldState.season} />
          <StatCard label="Weather" value={worldState.weather} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Locations ({locations.length})</span>
        </div>
        <div style={s.scrollList}>
          {locations.length === 0 ? (
            <EmptyState message="No locations defined" />
          ) : (
            locations.map((loc) => (
              <div key={loc.id} style={s.listItem}>
                <span style={{ color: COLORS.text, fontWeight: 600, flex: 1 }}>{loc.name}</span>
                <Badge text={loc.type} color={COLORS.accent} />
                <span style={s.monoSmall}>occupants: {loc.currentOccupants.length}/{loc.capacity}</span>
                <span style={s.monoSmall}>@ ({loc.x}, {loc.y})</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>World Facts ({facts.length})</span>
        </div>
        <div style={s.scrollList}>
          {facts.length === 0 ? (
            <EmptyState message="No facts learned" />
          ) : (
            facts.map((fact) => (
              <div key={fact.id} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div style={s.rowBetween}>
                  <span style={{ color: COLORS.text }}>{fact.content}</span>
                  <Badge text={fact.category} color={COLORS.purple} />
                </div>
                <span style={s.monoSmall}>known by: {fact.knownBy.length} NPCs · {formatRelative(fact.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Active Events ({activeEvents.length})</span>
        </div>
        {activeEvents.length === 0 ? (
          <EmptyState message="No active world events" />
        ) : (
          <div style={s.scrollList}>
            {activeEvents.map((ev) => (
              <div key={ev.id} style={{ ...s.listItem, flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
                <div style={s.rowBetween}>
                  <Badge text={ev.type} color={COLORS.warning} />
                  <span style={s.monoSmall}>duration: {ev.duration}</span>
                </div>
                <span style={{ color: COLORS.text }}>{ev.description}</span>
                <span style={s.monoSmall}>affected: {ev.affectedLocations.length} locations</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CacheTab({ cacheStats }: { cacheStats: CacheStats | null }) {
  if (!cacheStats) return <EmptyState message="No cache data available" />;

  const categories = Object.entries(cacheStats.entriesByCategory);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Cache Inspector</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Entries" value={cacheStats.totalEntries} accent />
          <StatCard label="Hit Rate" value={(cacheStats.hitRate * 100).toFixed(1) + '%'} sub={cacheStats.hitRate > 0.8 ? 'excellent' : cacheStats.hitRate > 0.5 ? 'good' : 'poor'} />
          <StatCard label="Est. Memory" value={formatBytes(cacheStats.estimatedMemoryBytes)} />
          <StatCard label="Total Hits" value={cacheStats.totalHits} />
          <StatCard label="Total Misses" value={cacheStats.totalMisses} />
          <StatCard label="Evictions" value={cacheStats.totalEvictions} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Entries by Category</span>
        </div>
        {categories.length === 0 ? (
          <EmptyState message="No cached entries" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.map(([cat, count]) => (
              <div key={cat}>
                <div style={s.barLabel}>
                  <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                  <span style={s.barValue}>{count}</span>
                </div>
                <Bar value={count} max={cacheStats.totalEntries} color={COLORS.accent} height={6} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function BatchWritesTab({ batchStats, runtime }: { batchStats: BatchWriteStats | null; runtime: any }) {
  if (!batchStats) return <EmptyState message="No batch write data" />;

  const tables = Object.entries(batchStats.writesByTable);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Batch Write Inspector</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Writes" value={batchStats.totalWrites} accent />
          <StatCard label="Total Flushes" value={batchStats.totalFlushes} />
          <StatCard label="Pending" value={batchStats.pendingWrites} sub={batchStats.pendingWrites > 0 ? 'queued' : 'idle'} />
          <StatCard label="Last Flush" value={batchStats.lastFlushMs.toFixed(1) + 'ms'} />
          <StatCard label="Avg Flush Size" value={batchStats.avgFlushSize.toFixed(1)} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Writes by Table</span>
        </div>
        {tables.length === 0 ? (
          <EmptyState message="No writes recorded" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tables.map(([table, count]) => (
              <div key={table}>
                <div style={s.barLabel}>
                  <span style={{ textTransform: 'capitalize' }}>{table}</span>
                  <span style={s.barValue}>{count}</span>
                </div>
                <Bar value={count} max={batchStats.totalWrites} color={COLORS.info} height={6} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PersistenceTab({ persistStats, runtime }: { persistStats: PersistenceStats | null; runtime: any }) {
  const [checkpoints, setCheckpoints] = useState<PersistenceCheckpoint[]>([]);

  useEffect(() => {
    try {
      setCheckpoints(runtime.persistence.getCheckpoints());
    } catch {
      /* noop */
    }
    const interval = setInterval(() => {
      try {
        setCheckpoints(runtime.persistence.getCheckpoints());
      } catch {
        /* noop */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [runtime]);

  if (!persistStats) return <EmptyState message="No persistence data" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Persistence Inspector</span>
          <Badge text={persistStats.isRunning ? 'RUNNING' : 'STOPPED'} color={persistStats.isRunning ? COLORS.positive : COLORS.textDim} />
        </div>
        <div style={s.grid3}>
          <StatCard label="Checkpoints" value={persistStats.totalCheckpoints} accent />
          <StatCard label="NPCs Persisted" value={persistStats.totalNPCsPersisted} />
          <StatCard label="Events Persisted" value={persistStats.totalEventsPersisted} />
          <StatCard label="Last Checkpoint" value={formatRelative(persistStats.lastCheckpointMs)} />
          <StatCard label="Avg Checkpoint" value={persistStats.avgCheckpointMs.toFixed(1) + 'ms'} />
          <StatCard label="Dirty NPCs" value={persistStats.dirtyNPCs} sub={persistStats.dirtyNPCs > 0 ? 'pending save' : 'clean'} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Checkpoint History</span>
          <span style={s.panelBadge}>{checkpoints.length}</span>
        </div>
        {checkpoints.length === 0 ? (
          <EmptyState message="No checkpoints yet" />
        ) : (
          <div style={s.scrollList}>
            {checkpoints.slice(-20).reverse().map((cp) => (
              <div key={cp.id} style={s.listItem}>
                <span style={{ ...s.monoSmall, color: COLORS.textDim, minWidth: 90 }}>{formatTime(cp.timestamp)}</span>
                <span style={s.monoSmall}>NPCs: <span style={{ color: COLORS.accent }}>{cp.npcCount}</span></span>
                <span style={s.monoSmall}>events: <span style={{ color: COLORS.text }}>{cp.eventCount}</span></span>
                <span style={s.monoSmall}>size: <span style={{ color: COLORS.warning }}>{formatBytes(cp.sizeBytes)}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function LODTab({ lodStats, npcs }: { lodStats: LODStats | null; npcs: NPCCore[] }) {
  if (!lodStats) return <EmptyState message="No LOD data available" />;

  const counts: Record<LODLevel, number> = {
    full: lodStats.fullCount,
    reduced: lodStats.reducedCount,
    minimal: lodStats.minimalCount,
    dormant: lodStats.dormantCount,
  };

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>LOD Inspector</span>
          <span style={s.panelBadge}>{lodStats.totalNPCs} NPCs</span>
        </div>
        <div style={s.grid4}>
          {LOD_LEVELS.map((level) => (
            <StatCard
              key={level}
              label={level}
              value={counts[level]}
              accent={level === 'full'}
            />
          ))}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Distribution</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LOD_LEVELS.map((level) => {
            const count = counts[level];
            const pct = lodStats.totalNPCs > 0 ? (count / lodStats.totalNPCs) * 100 : 0;
            return (
              <div key={level}>
                <div style={s.barLabel}>
                  <span style={{ textTransform: 'capitalize' }}>{level}</span>
                  <span style={s.barValue}>{count} ({pct.toFixed(1)}%)</span>
                </div>
                <Bar value={pct} max={100} color={LOD_COLORS[level]} height={10} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Per-NPC LOD Level</span>
          <span style={s.panelBadge}>changes: {lodStats.totalChanges}</span>
        </div>
        <div style={s.scrollList}>
          {npcs.map((npc) => (
            <div key={npc.id} style={s.listItem}>
              <span style={{ color: COLORS.text, fontWeight: 600, flex: 1 }}>{npc.name}</span>
              <Badge text={npc.lodLevel} color={LOD_COLORS[npc.lodLevel]} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ChunksTab({ chunkStats, runtime }: { chunkStats: ChunkStats | null; runtime: any }) {
  const [chunks, setChunks] = useState<SimulationChunk[]>([]);

  useEffect(() => {
    try {
      setChunks(runtime.chunkSimulation.getAllChunks());
    } catch {
      /* noop */
    }
    const interval = setInterval(() => {
      try {
        setChunks(runtime.chunkSimulation.getAllChunks());
      } catch {
        /* noop */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [runtime]);

  if (!chunkStats) return <EmptyState message="No chunk data available" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Chunk Inspector</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Chunks" value={chunkStats.totalChunks} accent />
          <StatCard label="Active Chunks" value={chunkStats.activeChunks} />
          <StatCard label="Dormant Chunks" value={chunkStats.dormantChunks} />
          <StatCard label="Total NPCs" value={chunkStats.totalNPCs} />
          <StatCard label="Active NPCs" value={chunkStats.activeNPCs} />
          <StatCard label="Avg NPCs/Chunk" value={chunkStats.avgNPCsPerChunk.toFixed(1)} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Chunk Grid</span>
          <span style={s.panelBadge}>{chunks.length} chunks</span>
        </div>
        <div style={s.gridViz}>
          {chunks.slice(0, 64).map((chunk) => {
            const color = chunk.isActive ? LOD_COLORS[chunk.lodLevel] : COLORS.cardAlt;
            return (
              <div
                key={`${chunk.coord.x}-${chunk.coord.y}`}
                style={{
                  ...s.gridCell,
                  backgroundColor: color + '22',
                  borderColor: color,
                }}
                title={`(${chunk.coord.x},${chunk.coord.y}) — ${chunk.npcIds.length} NPCs — ${chunk.lodLevel} — ${chunk.isActive ? 'active' : 'dormant'}`}
              >
                {chunk.npcIds.length}
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Chunk Details</span>
        </div>
        <div style={s.scrollList}>
          {chunks.map((chunk) => (
            <div key={`${chunk.coord.x}-${chunk.coord.y}`} style={s.listItem}>
              <span style={{ ...s.monoSmall, color: COLORS.textDim }}>({chunk.coord.x}, {chunk.coord.y})</span>
              <Badge text={chunk.lodLevel} color={LOD_COLORS[chunk.lodLevel]} />
              <span style={s.monoSmall}>NPCs: <span style={{ color: COLORS.accent }}>{chunk.npcIds.length}</span></span>
              <span style={s.monoSmall}>{chunk.isActive ? 'active' : 'dormant'}</span>
              <span style={s.monoSmall}>tick: {chunk.tickIntervalMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SchedulerTab({ schedStats }: { schedStats: SchedulerStats | null }) {
  if (!schedStats) return <EmptyState message="No scheduler data available" />;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Scheduler Inspector</span>
          <Badge text={schedStats.tasksOverBudget > 0 ? 'OVER BUDGET' : 'OK'} color={schedStats.tasksOverBudget > 0 ? COLORS.negative : COLORS.positive} />
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Tasks" value={schedStats.totalTasks} accent />
          <StatCard label="Total Executions" value={schedStats.totalExecutions} />
          <StatCard label="Over Budget" value={schedStats.tasksOverBudget} sub={schedStats.tasksOverBudget > 0 ? '⚠ warning' : 'healthy'} />
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Budget Utilization</span>
          <span style={s.panelBadge}>{(schedStats.budgetUtilization * 100).toFixed(1)}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: clamp(schedStats.budgetUtilization * 100, 0, 100) + '%', backgroundColor: schedStats.budgetUtilization > 0.8 ? COLORS.negative : schedStats.budgetUtilization > 0.5 ? COLORS.warning : COLORS.positive }} />
        </div>
        <div style={{ ...s.monoSmall, marginTop: 6 }}>Budget: {schedStats.budgetMs}ms</div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Task Table</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={s.th}>Name</th>
                <th style={s.th}>Priority</th>
                <th style={s.th}>Interval</th>
                <th style={s.th}>Execs</th>
                <th style={s.th}>Avg ms</th>
                <th style={s.th}>Max ms</th>
                <th style={s.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedStats.tasks.map((task: SchedulerTask) => (
                <tr key={task.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ ...s.td, color: COLORS.text, fontWeight: 600 }}>{task.name}</td>
                  <td style={s.td}>{task.priority}</td>
                  <td style={s.td}>{task.intervalMs}ms</td>
                  <td style={s.td}>{task.executionCount}</td>
                  <td style={{ ...s.td, color: task.avgExecutionMs > task.intervalMs * 0.5 ? COLORS.warning : COLORS.textMid }}>
                    {task.avgExecutionMs.toFixed(2)}
                  </td>
                  <td style={{ ...s.td, color: task.maxExecutionMs > task.intervalMs ? COLORS.negative : COLORS.textMid }}>
                    {task.maxExecutionMs.toFixed(2)}
                  </td>
                  <td style={s.td}>
                    {task.isOverBudget ? (
                      <Badge text="OVER" color={COLORS.negative} />
                    ) : task.enabled ? (
                      <Badge text="OK" color={COLORS.positive} />
                    ) : (
                      <Badge text="OFF" color={COLORS.textDim} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SandboxTab({ store, selectedNPCId, setSelectedNPCId }: { store: any; selectedNPCId: string | null; setSelectedNPCId: (id: string | null) => void }) {
  const [tickInterval, setTickInterval] = useState(5000);
  const [manualTicks, setManualTicks] = useState(0);

  const handleManualTick = () => {
    store.runtime.tickAll();
    setManualTicks((t) => t + 1);
  };

  const handleStart = () => {
    store.runtime.stopAutoSimulation();
    store.runtime.startAutoSimulation(tickInterval);
  };

  const handleStop = () => {
    store.runtime.stopAutoSimulation();
  };

  const selectedNPC = store.npcs.find((n: NPCCore) => n.id === selectedNPCId) ?? null;

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Autonomous Simulation Sandbox</span>
          <Badge text={store.isRunning ? 'RUNNING' : 'STOPPED'} color={store.isRunning ? COLORS.positive : COLORS.textDim} />
        </div>
        <div style={s.btnGroup}>
          <button style={s.btn} onClick={handleStart}>Start Auto-Sim</button>
          <button style={s.btnDanger} onClick={handleStop}>Stop Auto-Sim</button>
          <button style={s.btnSecondary} onClick={handleManualTick}>Manual Tick</button>
          <span style={s.muted}>Manual ticks: {manualTicks}</span>
        </div>
        <div style={s.divider} />
        <div style={s.row}>
          <label style={s.label}>Tick Interval (ms):</label>
          <input
            type="number"
            style={{ ...s.input, width: 100 }}
            value={tickInterval}
            onChange={(e) => setTickInterval(Number(e.target.value))}
            min={100}
            step={100}
          />
          <span style={s.muted}>Current: {(tickInterval / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>NPC Selector</span>
        </div>
        <NPCSelector npcs={store.npcs} selectedNPCId={selectedNPCId} onSelect={setSelectedNPCId} />
      </div>

      {selectedNPC && (
        <div style={s.panel}>
          <div style={s.panelTitle}>
            <span>Live State — {selectedNPC.name}</span>
          </div>
          <div style={s.grid3}>
            <StatCard label="Current Action" value={selectedNPC.currentAction ?? 'idle'} />
            <StatCard label="LOD Level" value={selectedNPC.lodLevel} />
            <StatCard label="Wallet" value={selectedNPC.wallet.toFixed(0) + 'g'} />
            <StatCard label="Position" value={`(${selectedNPC.position.x}, ${selectedNPC.position.y})`} />
            <StatCard label="Last Tick" value={formatRelative(selectedNPC.lastTickMs)} />
            <StatCard label="Alive" value={selectedNPC.isAlive ? 'Yes' : 'No'} />
          </div>
          <div style={s.divider} />
          <div style={s.sectionTitle}>Emotions (PAD)</div>
          <div style={s.inline}>
            <span style={s.monoSmall}>P: <span style={{ color: COLORS.positive }}>{selectedNPC.emotions.pad.pleasure.toFixed(3)}</span></span>
            <span style={s.monoSmall}>A: <span style={{ color: COLORS.warning }}>{selectedNPC.emotions.pad.arousal.toFixed(3)}</span></span>
            <span style={s.monoSmall}>D: <span style={{ color: COLORS.accent }}>{selectedNPC.emotions.pad.dominance.toFixed(3)}</span></span>
            <Badge text={selectedNPC.emotions.mood} color={MOOD_COLORS[selectedNPC.emotions.mood as MoodLabel]} />
          </div>
          <div style={s.divider} />
          <div style={s.sectionTitle}>Needs</div>
          <div style={s.grid4}>
            {NEED_TYPES.map((need) => (
              <div key={need} style={s.statCard}>
                <div style={s.statLabel}>{need}</div>
                <div style={s.statValueSmall}>{(selectedNPC.needs[need] ?? 0).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ExportImportTab({ store }: { store: any }) {
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  const handleExport = () => {
    try {
      const json = store.exportState();
      setExportText(json);
      setStatus({ type: 'success', msg: 'State exported successfully' });
    } catch (e) {
      setStatus({ type: 'error', msg: 'Export failed: ' + String(e) });
    }
  };

  const handleImport = () => {
    try {
      store.importState(importText);
      setStatus({ type: 'success', msg: 'State imported successfully' });
    } catch (e) {
      setStatus({ type: 'error', msg: 'Import failed: ' + String(e) });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elysium-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result));
    };
    reader.readAsText(file);
  };

  return (
    <>
      {status.type && (
        <div style={{
          ...s.panel,
          borderColor: status.type === 'success' ? COLORS.positive : COLORS.negative,
          borderLeft: `3px solid ${status.type === 'success' ? COLORS.positive : COLORS.negative}`,
        }}>
          <span style={{ color: status.type === 'success' ? COLORS.positive : COLORS.negative, fontWeight: 600 }}>
            {status.type === 'success' ? '✓' : '✗'} {status.msg}
          </span>
        </div>
      )}

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Export State</span>
        </div>
        <div style={s.btnGroup}>
          <button style={s.btn} onClick={handleExport}>Generate Export</button>
          <button style={s.btnSecondary} onClick={handleDownload} disabled={!exportText}>Download JSON</button>
        </div>
        <div style={s.divider} />
        <textarea
          style={s.textarea}
          value={exportText}
          readOnly
          placeholder="Click 'Generate Export' to produce state JSON..."
        />
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Import State</span>
        </div>
        <div style={s.btnGroup}>
          <button style={s.btn} onClick={handleImport} disabled={!importText}>Import from Text</button>
          <label style={{ ...s.btnSecondary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            Upload File
            <input type="file" accept=".json" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={s.divider} />
        <textarea
          style={s.textarea}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste JSON state here or upload a file..."
        />
      </div>
    </>
  );
}

function ReplayTab({ store }: { store: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedEvents, setRecordedEvents] = useState<CognitiveEvent[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordSubRef = useRef<string | null>(null);

  const handleStartRecording = () => {
    setRecordedEvents([]);
    setIsRecording(true);
    try {
      const subId = store.runtime.eventBus.subscribe('*', (event: CognitiveEvent) => {
        setRecordedEvents((prev) => [...prev, event]);
      });
      recordSubRef.current = subId;
    } catch {
      /* noop */
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recordSubRef.current) {
      try {
        store.runtime.eventBus.unsubscribe(recordSubRef.current);
      } catch {
        /* noop */
      }
      recordSubRef.current = null;
    }
  };

  const handlePlay = () => {
    if (recordedEvents.length === 0) return;
    setIsPlaying(true);
    setPlaybackIndex(0);
    const interval = Math.max(50, 500 / playbackSpeed);
    playRef.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= recordedEvents.length - 1) {
          if (playRef.current) clearInterval(playRef.current);
          setIsPlaying(false);
          return prev;
        }
        const event = recordedEvents[prev + 1];
        try {
          store.runtime.eventBus.emit({
            type: event.type,
            source: 'ReplayEngine',
            npcId: event.npcId,
            data: { ...event.data, replay: true },
          });
        } catch {
          /* noop */
        }
        return prev + 1;
      });
    }, interval);
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
  };

  const handleStepForward = () => {
    if (playbackIndex < recordedEvents.length - 1) {
      setPlaybackIndex(playbackIndex + 1);
      const event = recordedEvents[playbackIndex + 1];
      try {
        store.runtime.eventBus.emit({
          type: event.type,
          source: 'ReplayEngine',
          npcId: event.npcId,
          data: { ...event.data, replay: true },
        });
      } catch {
        /* noop */
      }
    }
  };

  const handleStepBackward = () => {
    if (playbackIndex > 0) {
      setPlaybackIndex(playbackIndex - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
      if (recordSubRef.current) {
        try {
          store.runtime.eventBus.unsubscribe(recordSubRef.current);
        } catch {
          /* noop */
        }
      }
    };
  }, [store.runtime]);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Deterministic Replay</span>
          {isRecording && <Badge text="RECORDING" color={COLORS.negative} />}
          {isPlaying && <Badge text="PLAYING" color={COLORS.positive} />}
        </div>
        <div style={s.btnGroup}>
          {!isRecording ? (
            <button style={s.btn} onClick={handleStartRecording}>Start Recording</button>
          ) : (
            <button style={s.btnDanger} onClick={handleStopRecording}>Stop Recording</button>
          )}
          <button style={s.btnSecondary} onClick={handlePlay} disabled={isPlaying || recordedEvents.length === 0}>Play</button>
          <button style={s.btnSecondary} onClick={handleStop} disabled={!isPlaying}>Stop</button>
          <button style={s.btnSecondary} onClick={handleStepBackward} disabled={isPlaying || playbackIndex === 0}>◀ Step Back</button>
          <button style={s.btnSecondary} onClick={handleStepForward} disabled={isPlaying || playbackIndex >= recordedEvents.length - 1}>Step Fwd ▶</button>
        </div>
        <div style={s.divider} />
        <div style={s.row}>
          <label style={s.label}>Playback Speed:</label>
          <select style={s.input} value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))}>
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Recorded Events</span>
          <span style={s.panelBadge}>{recordedEvents.length} events</span>
        </div>
        <div style={s.grid3}>
          <StatCard label="Total Recorded" value={recordedEvents.length} accent />
          <StatCard label="Playback Position" value={`${playbackIndex + 1} / ${recordedEvents.length || 0}`} />
          <StatCard label="Status" value={isRecording ? 'Recording' : isPlaying ? 'Playing' : 'Idle'} />
        </div>
        <div style={s.divider} />
        {recordedEvents.length === 0 ? (
          <EmptyState message="No events recorded. Click 'Start Recording' to begin." />
        ) : (
          <div style={s.scrollList}>
            {recordedEvents.map((event, idx) => (
              <div
                key={event.id}
                style={{
                  ...s.listItem,
                  backgroundColor: idx === playbackIndex ? COLORS.accentDim : undefined,
                  borderLeft: idx === playbackIndex ? `2px solid ${COLORS.accent}` : undefined,
                }}
              >
                <span style={{ ...s.tabIndex, color: idx === playbackIndex ? COLORS.accent : COLORS.textDim }}>
                  {String(idx + 1).padStart(3, '0')}
                </span>
                <span style={{ ...s.monoSmall, color: COLORS.textDim }}>{formatTime(event.timestamp)}</span>
                <Badge text={event.type} color={COLORS.accent} />
                {event.npcId && <span style={{ ...s.monoSmall, color: COLORS.purple }}>{event.npcId}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function LogsTab({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const [levelFilter, setLevelFilter] = useState<Set<LogLevel>>(new Set(LOG_LEVELS));

  const toggleLevel = (level: LogLevel) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return logs.filter((l) => levelFilter.has(l.level));
  }, [logs, levelFilter]);

  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
    logs.forEach((l) => { c[l.level]++; });
    return c;
  }, [logs]);

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelTitle}>
          <span>Log Inspector</span>
          <span style={s.panelBadge}>{filtered.length} / {logs.length} shown</span>
        </div>
        <div style={s.filterRow}>
          {LOG_LEVELS.map((level) => (
            <div
              key={level}
              style={{
                ...s.filterChip,
                ...(levelFilter.has(level) ? s.filterChipActive : {}),
                ...(levelFilter.has(level) ? { color: LOG_COLORS[level], borderColor: LOG_COLORS[level] } : {}),
              }}
              onClick={() => toggleLevel(level)}
            >
              {level} ({counts[level]})
            </div>
          ))}
          <button style={s.btnSecondary} onClick={onClear}>Clear Logs</button>
        </div>
        <div style={{ ...s.scrollList, maxHeight: 600 }}>
          {filtered.length === 0 ? (
            <EmptyState message="No logs match the current filter" />
          ) : (
            filtered.slice(-200).reverse().map((log) => (
              <div key={log.id} style={s.listItem}>
                <span style={{ ...s.monoSmall, color: COLORS.textDim, minWidth: 90 }}>{formatTime(log.timestamp)}</span>
                <Badge text={log.level.toUpperCase()} color={LOG_COLORS[log.level]} />
                <span style={{ ...s.monoSmall, color: COLORS.accent }}>{log.source}</span>
                {log.npcId && <span style={{ ...s.monoSmall, color: COLORS.purple }}>{log.npcId}</span>}
                <span style={{ color: COLORS.textMid, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SDKTab({ runtime }: { runtime: any }) {
  const [api, setApi] = useState<ElysiumAPI | null>(null);
  const [stats, setStats] = useState<ElysiumSDKStats | null>(null);

  useEffect(() => {
    const instance = new ElysiumAPI({ autoStart: false });
    setApi(instance);
    const updateStats = () => setStats(instance.getStats());
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>SDK Public API</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Registered Plugins" value={stats?.registeredPlugins ?? 0} accent />
        <StatCard label="Registered Actions" value={stats?.registeredActions ?? 0} />
        <StatCard label="Registered Goals" value={stats?.registeredGoals ?? 0} />
        <StatCard label="Debug Panels" value={stats?.registeredDebugPanels ?? 0} />
        <StatCard label="API Calls" value={stats?.apiCalls ?? 0} />
        <StatCard label="Uptime (s)" value={stats ? Math.floor(stats.uptime / 1000) : 0} />
      </div>
      <div style={{ ...s.card, padding: '16px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: COLORS.text }}>Quick Start</h3>
        <pre style={{ ...s.monoSmall, background: '#0a0e17', padding: '12px', borderRadius: '6px', overflow: 'auto', color: COLORS.textMid, fontSize: '11px' }}>{`import { ElysiumAPI } from './sdk';

const api = new ElysiumAPI({ autoStart: true });
const npc = api.createNPC({ name: 'Hero', personality: { openness: 80, conscientiousness: 70, extraversion: 60, agreeableness: 50, neuroticism: 30 } });
api.setGoal(npc.id, { name: 'survive', priority: 10, targetState: { alive: true } });
api.subscribe('EMOTION_CHANGED', (e) => console.log(e));`}</pre>
      </div>
      <div style={{ ...s.card, padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: COLORS.text }}>Available Methods</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {['createNPC', 'removeNPC', 'getNPC', 'getAllNPCs', 'setGoal', 'planGoal', 'tick', 'start', 'stop', 'emit', 'subscribe', 'unsubscribe', 'getWorldState', 'triggerWorldEvent', 'getEconomyPrice', 'trade', 'setPlayerPosition', 'getNPCLOD', 'exportState', 'importState', 'getStats', 'getPluginManager', 'getDebugPanels', 'getRuntime'].map(m => (
            <div key={m} style={{ ...s.monoSmall, padding: '4px 8px', color: COLORS.info, fontSize: '11px' }}>{m}()</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenchmarksTab() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [suites, setSuites] = useState<BenchmarkSuite[]>([]);

  const runBenchmarks = () => {
    setRunning(true);
    setResults([]);
    setSuites([]);
    setTimeout(() => {
      try {
        const bench = new CognitiveBenchmarks();
        const allSuites = bench.runAll();
        setSuites(allSuites);
        const runner = new BenchmarkRunner();
        const formatted = allSuites.map(s => runner.formatSuite(s));
        setResults(formatted);
      } catch (e: any) {
        setResults([`Error: ${e.message}`]);
      } finally {
        setRunning(false);
      }
    }, 50);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: COLORS.text }}>Cognitive Benchmarks</h2>
        <button
          onClick={runBenchmarks}
          disabled={running}
          style={{
            padding: '6px 16px',
            background: running ? COLORS.border : COLORS.accent,
            color: running ? COLORS.textMid : '#fff',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Running...' : 'Run All Benchmarks'}
        </button>
      </div>
      {suites.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {suites.map(suite => (
            <div key={suite.name} style={{ ...s.card, padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.text, marginBottom: '8px' }}>{suite.name}</div>
              <div style={{ fontSize: '11px', color: COLORS.textMid }}>Benchmarks: {suite.results.length}</div>
              <div style={{ fontSize: '11px', color: COLORS.positive }}>Total: {suite.totalMs.toFixed(2)}ms</div>
            </div>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div style={{ ...s.card, padding: '12px' }}>
          {results.map((r, i) => (
            <pre key={i} style={{ ...s.monoSmall, whiteSpace: 'pre-wrap', color: COLORS.textMid, fontSize: '11px', marginBottom: '12px' }}>{r}</pre>
          ))}
        </div>
      )}
      {!running && results.length === 0 && (
        <div style={{ ...s.card, padding: '24px', textAlign: 'center', color: COLORS.textDim }}>
          Click "Run All Benchmarks" to measure cognitive module performance.
        </div>
      )}
    </div>
  );
}

function PluginsTab({ runtime }: { runtime: any }) {
  const [pluginManager] = useState(() => {
    const registry = { onRegister: () => {}, onUnregister: () => {} };
    return new PluginManager(runtime, registry as any);
  });
  const [loadedPlugins, setLoadedPlugins] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(l => [...l.slice(-20), msg]);

  const loadSamplePlugin = () => {
    const samplePlugin = {
      manifest: {
        name: 'weather-effects',
        version: '1.0.0',
        author: 'Elysium SDK',
        description: 'Adds weather-based emotional effects to NPCs',
        permissions: ['read:npc', 'write:npc', 'emit:events', 'register:debug-panels'],
      },
      install(ctx: any) {
        addLog('Plugin installed: weather-effects');
        ctx.registerDebugPanel({
          id: 'weather-panel',
          name: 'Weather Effects',
          render: () => 'Weather effects panel',
        });
      },
      onTick(npcs: any[]) {
        addLog(`Plugin onTick: processing ${npcs.length} NPCs`);
      },
      onEvent(event: any) {
        if (event.type === 'WORLD_WEATHER_CHANGED') {
          addLog(`Weather changed: ${JSON.stringify(event.data)}`);
        }
      },
    };
    try {
      pluginManager.load(samplePlugin as any);
      setLoadedPlugins(pluginManager.getLoadedPlugins());
      addLog('Loaded: weather-effects');
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const unloadPlugin = (name: string) => {
    pluginManager.unload(name);
    setLoadedPlugins(pluginManager.getLoadedPlugins());
    addLog(`Unloaded: ${name}`);
  };

  const stats = pluginManager.getStats();

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.text }}>Plugin Manager</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Loaded Plugins" value={stats.registeredPlugins} accent />
        <StatCard label="Registered Actions" value={stats.registeredActions} />
        <StatCard label="Registered Goals" value={stats.registeredGoals} />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={loadSamplePlugin} style={{ padding: '6px 16px', background: COLORS.accent, color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Load Sample Plugin
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ ...s.card, padding: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: COLORS.text }}>Loaded Plugins</h3>
          {loadedPlugins.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: '12px' }}>No plugins loaded</div>
          ) : (
            loadedPlugins.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>{name}</span>
                <button onClick={() => unloadPlugin(name)} style={{ padding: '2px 8px', fontSize: '11px', color: COLORS.negative, cursor: 'pointer' }}>Unload</button>
              </div>
            ))
          )}
        </div>
        <div style={{ ...s.card, padding: '12px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: COLORS.text }}>Plugin Log</h3>
          {log.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: '12px' }}>No activity</div>
          ) : (
            log.map((l, i) => (
              <div key={i} style={{ ...s.monoSmall, fontSize: '11px', color: COLORS.textMid, padding: '2px 0' }}>{l}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
