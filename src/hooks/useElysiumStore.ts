import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  NPCCore,
  NPCId,
  CognitiveEvent,
  LogEntry,
  PerformanceStats,
  BackgroundStats,
  CacheStats,
  BatchWriteStats,
  PersistenceStats,
  SchedulerStats,
  LODStats,
  ChunkStats,
  WorldState,
  GossipItem,
  Faction,
  EconomyItemType,
  BigFiveTrait,
  EmotionLabel,
  MoodLabel,
  MemoryType,
  NeedType,
  LODLevel,
} from '../engine/types';
import { ElysiumRuntime } from '../engine/elysium-runtime';

let runtimeInstance: ElysiumRuntime | null = null;

export function getRuntime(): ElysiumRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new ElysiumRuntime();
  }
  return runtimeInstance;
}

const NEUTRAL_PAD = { pleasure: 0, arousal: 0, dominance: 0 };
const NEUTRAL_EMOTIONS: Record<EmotionLabel, number> = {
  joy: 0,
  sadness: 0,
  anger: 0,
  fear: 0,
  disgust: 0,
  surprise: 0,
};
const EMPTY_MEMORIES = {
  working: [],
  short: [],
  long: [],
  semantic: [],
  procedural: [],
  flashbulb: [],
  trauma: [],
} as Record<MemoryType, NPCCore['memories'][MemoryType]>;

function makeNeeds(min: number, max: number): Record<NeedType, number> {
  const mid = (min + max) / 2;
  return {
    hunger: mid,
    thirst: mid,
    sleep: mid,
    social: mid,
    safety: mid,
    esteem: mid,
    selfActualization: mid,
  };
}

function makeNPC(
  id: string,
  name: string,
  age: number,
  personality: Record<BigFiveTrait, number>,
): NPCCore {
  return {
    id,
    name,
    age,
    personality,
    emotions: {
      pad: { ...NEUTRAL_PAD },
      emotions: { ...NEUTRAL_EMOTIONS },
      mood: 'neutral' as MoodLabel,
    },
    needs: makeNeeds(50, 70),
    memories: {
      working: [...EMPTY_MEMORIES.working],
      short: [...EMPTY_MEMORIES.short],
      long: [...EMPTY_MEMORIES.long],
      semantic: [...EMPTY_MEMORIES.semantic],
      procedural: [...EMPTY_MEMORIES.procedural],
      flashbulb: [...EMPTY_MEMORIES.flashbulb],
      trauma: [...EMPTY_MEMORIES.trauma],
    },
    relationships: {},
    currentGoal: null,
    currentPlan: null,
    currentAction: null,
    position: { x: 0, y: 0 },
    isAlive: true,
    thoughtHistory: [],
    decisionHistory: [],
    predictions: [],
    reflections: [],
    episodicEvents: [],
    personalityDriftHistory: [],
    wallet: 100,
    schedule: null,
    factionId: null,
    knownFacts: [],
    lastTickMs: Date.now(),
    lodLevel: 'full' as LODLevel,
  };
}

export function seedNPCs(): NPCCore[] {
  const runtime = getRuntime();
  const seeds: NPCCore[] = [
    makeNPC('aldric', 'Aldric', 45, {
      openness: 0.4,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.3,
      neuroticism: 0.5,
    }),
    makeNPC('mira', 'Mira', 28, {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.7,
      agreeableness: 0.7,
      neuroticism: 0.4,
    }),
    makeNPC('theron', 'Theron', 52, {
      openness: 0.3,
      conscientiousness: 0.5,
      extraversion: 0.2,
      agreeableness: 0.4,
      neuroticism: 0.7,
    }),
    makeNPC('lyra', 'Lyra', 19, {
      openness: 0.7,
      conscientiousness: 0.4,
      extraversion: 0.9,
      agreeableness: 0.6,
      neuroticism: 0.6,
    }),
    makeNPC('kael', 'Kael', 34, {
      openness: 0.5,
      conscientiousness: 0.7,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.3,
    }),
  ];
  for (const npc of seeds) {
    runtime.registerNPC(npc);
  }
  return seeds;
}

export interface ElysiumStore {
  npcs: NPCCore[];
  selectedNPCId: NPCId | null;
  selectedNPC: NPCCore | null;
  selectNPC: (id: NPCId | null) => void;
  isRunning: boolean;
  startSim: (intervalMs?: number) => void;
  stopSim: () => void;
  tickCount: number;
  events: CognitiveEvent[];
  clearEvents: () => void;
  logs: LogEntry[];
  clearLogs: () => void;
  perfStats: PerformanceStats;
  triggerBetrayal: (npcId: NPCId, targetId: NPCId) => void;
  triggerConversation: (npcId: NPCId, targetId: NPCId) => void;
  triggerItemFound: (npcId: NPCId, itemType: EconomyItemType) => void;
  triggerAttack: (npcId: NPCId, targetId: NPCId) => void;
  triggerReward: (npcId: NPCId, amount: number) => void;
  triggerRumor: (npcId: NPCId, topic: string, targetId: NPCId) => void;
  bgRunning: boolean;
  bgStats: BackgroundStats;
  startBackground: (intervalMs?: number) => void;
  stopBackground: () => void;
  manualBgTick: () => void;
  worldState: WorldState;
  gossip: GossipItem[];
  factions: Faction[];
  cacheStats: CacheStats;
  batchStats: BatchWriteStats;
  persistStats: PersistenceStats;
  schedStats: SchedulerStats;
  lodStats: LODStats;
  chunkStats: ChunkStats;
  exportState: () => string;
  importState: (json: string) => void;
  runtime: ElysiumRuntime;
}

const EMPTY_PERF: PerformanceStats = {
  tickCount: 0,
  lastTickMs: 0,
  avgTickMs: 0,
  maxTickMs: 0,
  totalEvents: 0,
  activeNPCs: 0,
};

const EMPTY_BG: BackgroundStats = {
  ticks: 0,
  lastTickMs: 0,
  avgTickMs: 0,
  phaseTimings: {},
};

const EMPTY_CACHE: CacheStats = {
  totalEntries: 0,
  totalHits: 0,
  totalMisses: 0,
  totalEvictions: 0,
  hitRate: 0,
  estimatedMemoryBytes: 0,
  entriesByCategory: {},
};

const EMPTY_BATCH: BatchWriteStats = {
  totalWrites: 0,
  totalFlushes: 0,
  pendingWrites: 0,
  lastFlushMs: 0,
  avgFlushSize: 0,
  writesByTable: {},
};

const EMPTY_PERSIST: PersistenceStats = {
  totalCheckpoints: 0,
  totalNPCsPersisted: 0,
  totalEventsPersisted: 0,
  lastCheckpointMs: 0,
  avgCheckpointMs: 0,
  isRunning: false,
  dirtyNPCs: 0,
};

const EMPTY_SCHED: SchedulerStats = {
  totalTasks: 0,
  totalExecutions: 0,
  tasksOverBudget: 0,
  budgetUtilization: 0,
  budgetMs: 0,
  tasks: [],
};

const EMPTY_LOD: LODStats = {
  totalNPCs: 0,
  fullCount: 0,
  reducedCount: 0,
  minimalCount: 0,
  dormantCount: 0,
  totalChanges: 0,
};

const EMPTY_CHUNK: ChunkStats = {
  totalChunks: 0,
  activeChunks: 0,
  dormantChunks: 0,
  totalNPCs: 0,
  activeNPCs: 0,
  avgNPCsPerChunk: 0,
};

const EMPTY_WORLD: WorldState = {
  day: 0,
  hour: 0,
  season: 'spring',
  weather: 'clear',
  locations: {},
  facts: [],
  activeEvents: [],
};

export function useElysiumStore(): ElysiumStore {
  const runtime = useMemo(() => getRuntime(), []);

  const [npcs, setNpcs] = useState<NPCCore[]>(() => runtime.getAllNPCs());
  const [selectedNPCId, setSelectedNPCId] = useState<NPCId | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(() => runtime.isAutoRunning());
  const [tickCount, setTickCount] = useState<number>(runtime.tickCount);
  const [events, setEvents] = useState<CognitiveEvent[]>(() => runtime.getEventHistory());
  const [logs, setLogs] = useState<LogEntry[]>(() => runtime.getLogs());
  const [perfStats, setPerfStats] = useState<PerformanceStats>(() => runtime.getPerformanceStats() ?? EMPTY_PERF);
  const [bgRunning, setBgRunning] = useState<boolean>(false);
  const [bgStats, setBgStats] = useState<BackgroundStats>(() => runtime.getBackgroundStats() ?? EMPTY_BG);
  const [worldState, setWorldState] = useState<WorldState>(() => {
    try {
      return runtime.getWorldState() ?? EMPTY_WORLD;
    } catch {
      return EMPTY_WORLD;
    }
  });
  const [gossip, setGossip] = useState<GossipItem[]>(() => runtime.getActiveGossip() ?? []);
  const [factions, setFactions] = useState<Faction[]>(() => runtime.getFactions() ?? []);
  const [cacheStats, setCacheStats] = useState<CacheStats>(() => runtime.getCacheStats() ?? EMPTY_CACHE);
  const [batchStats, setBatchStats] = useState<BatchWriteStats>(() => runtime.getBatchWriteStats() ?? EMPTY_BATCH);
  const [persistStats, setPersistStats] = useState<PersistenceStats>(() => runtime.getPersistenceStats() ?? EMPTY_PERSIST);
  const [schedStats, setSchedStats] = useState<SchedulerStats>(() => runtime.getSchedulerStats() ?? EMPTY_SCHED);
  const [lodStats, setLodStats] = useState<LODStats>(() => runtime.getLODStats() ?? EMPTY_LOD);
  const [chunkStats, setChunkStats] = useState<ChunkStats>(() => runtime.getChunkStats() ?? EMPTY_CHUNK);

  const eventsRef = useRef<CognitiveEvent[]>(events);
  eventsRef.current = events;

  useEffect(() => {
    const id = setInterval(() => {
      setNpcs(runtime.getAllNPCs());
      setIsRunning(runtime.isAutoRunning());
      setTickCount(runtime.tickCount);
      setPerfStats(runtime.getPerformanceStats());
      setBgStats(runtime.getBackgroundStats());
      setLogs(runtime.getLogs());
      try {
        setWorldState(runtime.getWorldState());
      } catch {
        // world state may be unavailable before initialization
      }
      setGossip(runtime.getActiveGossip());
      setFactions(runtime.getFactions());
      setCacheStats(runtime.getCacheStats());
      setBatchStats(runtime.getBatchWriteStats());
      setPersistStats(runtime.getPersistenceStats());
      setSchedStats(runtime.getSchedulerStats());
      setLodStats(runtime.getLODStats());
      setChunkStats(runtime.getChunkStats());
    }, 2000);
    return () => clearInterval(id);
  }, [runtime]);

  useEffect(() => {
    const unsubId = runtime.eventBus.subscribe('*' as any, (event: CognitiveEvent) => {
      setEvents((prev) => {
        const next = [...prev, event];
        if (next.length > 500) next.splice(0, next.length - 500);
        return next;
      });
    });
    return () => {
      runtime.eventBus.unsubscribe(unsubId);
    };
  }, [runtime]);

  const selectNPC = useCallback((id: NPCId | null) => {
    setSelectedNPCId(id);
  }, []);

  const startSim = useCallback((intervalMs?: number) => {
    runtime.startAutoSimulation(intervalMs);
    setIsRunning(runtime.isAutoRunning());
  }, [runtime]);

  const stopSim = useCallback(() => {
    runtime.stopAutoSimulation();
    setIsRunning(runtime.isAutoRunning());
  }, [runtime]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const clearLogs = useCallback(() => {
    runtime.clearLogs();
    setLogs([]);
  }, [runtime]);

  const triggerBetrayal = useCallback((npcId: NPCId, targetId: NPCId) => {
    runtime.triggerBetrayal(npcId, targetId);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const triggerConversation = useCallback((npcId: NPCId, targetId: NPCId) => {
    runtime.triggerConversation(npcId, targetId);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const triggerItemFound = useCallback((npcId: NPCId, itemType: EconomyItemType) => {
    runtime.triggerItemFound(npcId, itemType);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const triggerAttack = useCallback((npcId: NPCId, targetId: NPCId) => {
    runtime.triggerAttack(npcId, targetId);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const triggerReward = useCallback((npcId: NPCId, amount: number) => {
    runtime.triggerReward(npcId, amount);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const triggerRumor = useCallback((npcId: NPCId, topic: string, targetId: NPCId) => {
    runtime.triggerRumor(npcId, topic, targetId);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const startBackground = useCallback((intervalMs?: number) => {
    runtime.startBackground(intervalMs);
    setBgRunning(true);
    setBgStats(runtime.getBackgroundStats());
  }, [runtime]);

  const stopBackground = useCallback(() => {
    runtime.stopBackground();
    setBgRunning(false);
    setBgStats(runtime.getBackgroundStats());
  }, [runtime]);

  const manualBgTick = useCallback(() => {
    runtime.manualBgTick();
    setBgStats(runtime.getBackgroundStats());
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const exportState = useCallback(() => runtime.exportState(), [runtime]);

  const importState = useCallback((json: string) => {
    runtime.importState(json);
    setNpcs(runtime.getAllNPCs());
  }, [runtime]);

  const selectedNPC = useMemo(() => {
    if (!selectedNPCId) return null;
    return runtime.getNPC(selectedNPCId) ?? null;
  }, [runtime, selectedNPCId, npcs]);

  return {
    npcs,
    selectedNPCId,
    selectedNPC,
    selectNPC,
    isRunning,
    startSim,
    stopSim,
    tickCount,
    events,
    clearEvents,
    logs,
    clearLogs,
    perfStats,
    triggerBetrayal,
    triggerConversation,
    triggerItemFound,
    triggerAttack,
    triggerReward,
    triggerRumor,
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
  };
}
