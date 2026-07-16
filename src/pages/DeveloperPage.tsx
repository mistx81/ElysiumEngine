import { useEffect, useMemo, useRef, useState } from 'react';
import { useElysiumStore, seedNPCs } from '../hooks/useElysiumStore';

import EventBusPanel from '../components/developer/EventBusPanel';
import MemoryPanel from '../components/developer/MemoryPanel';
import GOAPPanel from '../components/developer/GOAPPanel';
import PADPanel from '../components/developer/PADPanel';
import RelationshipPanel from '../components/developer/RelationshipPanel';
import GoalsPanel from '../components/developer/GoalsPanel';
import NeedsPanel from '../components/developer/NeedsPanel';
import DecisionsPanel from '../components/developer/DecisionsPanel';
import PerformancePanel from '../components/developer/PerformancePanel';
import EconomyPanel from '../components/developer/EconomyPanel';
import SchedulePanel from '../components/developer/SchedulePanel';
import SocialPanel from '../components/developer/SocialPanel';
import WorldPanel from '../components/developer/WorldPanel';
import CachePanel from '../components/developer/CachePanel';
import BatchWritesPanel from '../components/developer/BatchWritesPanel';
import PersistencePanel from '../components/developer/PersistencePanel';
import LODPanel from '../components/developer/LODPanel';
import ChunksPanel from '../components/developer/ChunksPanel';
import SchedulerPanel from '../components/developer/SchedulerPanel';
import SandboxPanel from '../components/developer/SandboxPanel';
import ExportImportPanel from '../components/developer/ExportImportPanel';
import ReplayPanel from '../components/developer/ReplayPanel';
import LogsPanel from '../components/developer/LogsPanel';
import SDKPanel from '../components/developer/SDKPanel';
import BenchmarksPanel from '../components/developer/BenchmarksPanel';
import PluginsPanel from '../components/developer/PluginsPanel';

interface TabDef {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  npcSpecific: boolean;
}

const TABS: TabDef[] = [
  { id: 'event-bus', label: 'Event Bus', component: EventBusPanel, npcSpecific: false },
  { id: 'memory', label: 'Memory', component: MemoryPanel, npcSpecific: true },
  { id: 'goap', label: 'GOAP', component: GOAPPanel, npcSpecific: true },
  { id: 'pad', label: 'PAD', component: PADPanel, npcSpecific: true },
  { id: 'relationship', label: 'Relationship', component: RelationshipPanel, npcSpecific: true },
  { id: 'goals', label: 'Goals', component: GoalsPanel, npcSpecific: true },
  { id: 'needs', label: 'Needs', component: NeedsPanel, npcSpecific: true },
  { id: 'decisions', label: 'Decisions', component: DecisionsPanel, npcSpecific: true },
  { id: 'performance', label: 'Performance', component: PerformancePanel, npcSpecific: false },
  { id: 'economy', label: 'Economy', component: EconomyPanel, npcSpecific: true },
  { id: 'schedule', label: 'Schedule', component: SchedulePanel, npcSpecific: true },
  { id: 'social', label: 'Social', component: SocialPanel, npcSpecific: false },
  { id: 'world', label: 'World', component: WorldPanel, npcSpecific: false },
  { id: 'cache', label: 'Cache', component: CachePanel, npcSpecific: false },
  { id: 'batch-writes', label: 'Batch Writes', component: BatchWritesPanel, npcSpecific: false },
  { id: 'persistence', label: 'Persistence', component: PersistencePanel, npcSpecific: false },
  { id: 'lod', label: 'LOD', component: LODPanel, npcSpecific: false },
  { id: 'chunks', label: 'Chunks', component: ChunksPanel, npcSpecific: false },
  { id: 'scheduler', label: 'Scheduler', component: SchedulerPanel, npcSpecific: false },
  { id: 'sandbox', label: 'Sandbox', component: SandboxPanel, npcSpecific: false },
  { id: 'export-import', label: 'Export / Import', component: ExportImportPanel, npcSpecific: false },
  { id: 'replay', label: 'Replay', component: ReplayPanel, npcSpecific: false },
  { id: 'logs', label: 'Logs', component: LogsPanel, npcSpecific: false },
  { id: 'sdk', label: 'SDK', component: SDKPanel, npcSpecific: false },
  { id: 'benchmarks', label: 'Benchmarks', component: BenchmarksPanel, npcSpecific: false },
  { id: 'plugins', label: 'Plugins', component: PluginsPanel, npcSpecific: false },
];

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const styles: Record<string, any> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.border}`,
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  topBarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.02em',
  },
  topBarAccent: {
    width: '4px',
    height: '18px',
    backgroundColor: COLORS.accent,
    borderRadius: '2px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  npcLabel: {
    fontSize: '12px',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  npcSelect: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    minWidth: '180px',
    cursor: 'pointer',
    outline: 'none',
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
    backgroundColor: COLORS.card,
    borderRight: `1px solid ${COLORS.border}`,
    overflowY: 'auto',
    padding: '8px 0',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '13px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: COLORS.text,
    borderLeft: `3px solid ${COLORS.accent}`,
    fontWeight: 600,
  },
  tabHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tabDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: COLORS.accent,
    marginRight: '8px',
    opacity: 0,
    flexShrink: 0,
  },
  tabDotVisible: {
    opacity: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflow: 'auto',
    padding: '20px',
    backgroundColor: COLORS.bg,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: COLORS.textMuted,
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.4,
  },
  npcRequired: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: COLORS.warning,
    gap: '8px',
    textAlign: 'center',
  },
  panelWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
  },
};

export default function DeveloperPage(props: any) {
  const store = useElysiumStore();
  const {
    npcs,
    selectedNPCId,
    selectedNPC,
    selectNPC,
    events,
    clearEvents,
    logs,
    clearLogs,
    perfStats,
    bgRunning,
    bgStats,
    startBackground,
    stopBackground,
    manualBgTick,
    worldState,
    gossip,
    factions,
    cacheStats,
    batchStats,
    persistStats,
    schedStats,
    lodStats,
    chunkStats,
    exportState,
    importState,
    runtime,
    isRunning,
    startSim,
    stopSim,
    tickCount,
    triggerBetrayal,
    triggerConversation,
    triggerItemFound,
    triggerAttack,
    triggerReward,
    triggerRumor,
  } = store;

  const [activeTab, setActiveTab] = useState<string>('event-bus');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
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

  const activeTabDef = useMemo(
    () => TABS.find((t) => t.id === activeTab) ?? TABS[0],
    [activeTab],
  );

  const panelProps = useMemo(
    () => ({
      ...store,
      npcs,
      selectedNPCId,
      selectedNPC,
      selectNPC,
      events,
      clearEvents,
      logs,
      clearLogs,
      perfStats,
      bgRunning,
      bgStats,
      startBackground,
      stopBackground,
      manualBgTick,
      worldState,
      gossip,
      factions,
      cacheStats,
      batchStats,
      persistStats,
      schedStats,
      lodStats,
      chunkStats,
      exportState,
      importState,
      runtime,
      isRunning,
      startSim,
      stopSim,
      tickCount,
      triggerBetrayal,
      triggerConversation,
      triggerItemFound,
      triggerAttack,
      triggerReward,
      triggerRumor,
      ...props,
    }),
    [
      store, npcs, selectedNPCId, selectedNPC, events, logs, perfStats,
      bgRunning, bgStats, worldState, gossip, factions, cacheStats, batchStats,
      persistStats, schedStats, lodStats, chunkStats, isRunning, tickCount,
      props,
    ],
  );

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleNpcChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    selectNPC(value === '__none__' ? null : value);
  };

  const ActiveComponent = activeTabDef.component;
  const requiresNpc = activeTabDef.npcSpecific && !selectedNPC;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={styles.topBarAccent} />
          <h1 style={styles.topBarTitle}>Developer Tools</h1>
          <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
            Elysium Engine · {TABS.length} panels
          </span>
        </div>
        <div style={styles.topBarRight}>
          <label style={styles.npcLabel} htmlFor="dev-npc-select">
            NPC
          </label>
          <select
            id="dev-npc-select"
            style={styles.npcSelect}
            value={selectedNPCId ?? '__none__'}
            onChange={handleNpcChange}
          >
            <option value="__none__">— None —</option>
            {npcs.map((npc) => (
              <option key={npc.id} value={npc.id}>
                {npc.name} ({npc.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const isHovered = hoveredTab === tab.id;
            const tabStyle: Record<string, any> = {
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
              ...(!isActive && isHovered ? styles.tabHover : {}),
            };
            const dotStyle: Record<string, any> = {
              ...styles.tabDot,
              ...(isActive ? styles.tabDotVisible : {}),
            };
            return (
              <div
                key={tab.id}
                style={tabStyle}
                onClick={() => handleTabClick(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                title={tab.label}
              >
                <span style={dotStyle} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        <div style={styles.content}>
          {requiresNpc ? (
            <div style={styles.npcRequired}>
              <div style={{ fontSize: '28px', opacity: 0.6 }}>⚠</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                NPC selection required
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                The "{activeTabDef.label}" panel needs an NPC selected above.
              </div>
            </div>
          ) : (
            <div style={styles.panelWrapper}>
              <ActiveComponent {...panelProps} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
