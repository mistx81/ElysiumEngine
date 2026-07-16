import type {
  CognitiveEvent,
  CognitiveEventType,
  DebugPanelConfig,
  EconomyItemType,
  EconomyTransaction,
  ElysiumPlugin,
  ElysiumSDKStats,
  GOAPGoal,
  GOAPPlan,
  GOAPWorldState,
  LODLevel,
  NPCCore,
  NPCId,
  PublicAPIConfig,
  Vec2,
  WorldEventType,
} from '../engine/types';
import { ElysiumRuntime } from '../engine/elysium-runtime';
import { PluginManager } from './plugin-manager';
import { DebugPanelRegistry } from './debug-panel-registry';

type EventHandler = (event: CognitiveEvent) => void;

type Subscription = {
  id: string;
  eventType: CognitiveEventType;
  handler: EventHandler;
};

type ResolvedConfig = Required<PublicAPIConfig>;

const DEFAULT_CONFIG: ResolvedConfig = {
  autoStart: false,
  tickIntervalMs: 1000,
  maxNPCs: 10000,
  enableCache: true,
  enableBatchWrites: true,
  enablePersistence: true,
  enableScheduler: true,
  enableLOD: true,
  enableChunks: true,
};

let subIdCounter = 0;

function generateSubId(): string {
  subIdCounter += 1;
  return `api_sub_${Date.now()}_${subIdCounter}`;
}

export class ElysiumAPI {
  private config: ResolvedConfig;
  private runtime: ElysiumRuntime;
  private pluginManager: PluginManager;
  private debugPanels: DebugPanelRegistry;
  private subscriptions: Map<string, Subscription> = new Map();
  private apiCallCount: number = 0;
  private startTime: number;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  constructor(config?: PublicAPIConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.runtime = new ElysiumRuntime();
    this.debugPanels = new DebugPanelRegistry();
    this.pluginManager = new PluginManager(this.runtime, this.debugPanels);
    this.startTime = Date.now();

    if (this.config.autoStart) {
      this.start();
    }
  }

  createNPC(partial: Partial<NPCCore>): NPCCore {
    this.trackCall('createNPC');
    if (this.runtime.npcs.size >= this.config.maxNPCs) {
      throw new Error(`[ElysiumAPI] maxNPCs limit (${this.config.maxNPCs}) reached.`);
    }
    const id = partial.id ?? `npc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const npc: NPCCore = {
      id,
      name: partial.name ?? `NPC-${id}`,
      age: partial.age ?? 25,
      personality: partial.personality ?? {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      emotions: partial.emotions ?? {
        pad: { pleasure: 0, arousal: 0, dominance: 0 },
        emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0, surprise: 0 },
        mood: 'neutral',
      },
      needs: partial.needs ?? {
        hunger: 50,
        thirst: 50,
        sleep: 50,
        social: 50,
        safety: 50,
        esteem: 50,
        selfActualization: 50,
      },
      memories: partial.memories ?? {
        working: [],
        short: [],
        long: [],
        semantic: [],
        procedural: [],
        flashbulb: [],
        trauma: [],
      },
      relationships: partial.relationships ?? {},
      currentGoal: partial.currentGoal ?? null,
      currentPlan: partial.currentPlan ?? null,
      currentAction: partial.currentAction ?? null,
      position: partial.position ?? { x: 0, y: 0 },
      isAlive: partial.isAlive ?? true,
      thoughtHistory: partial.thoughtHistory ?? [],
      decisionHistory: partial.decisionHistory ?? [],
      predictions: partial.predictions ?? [],
      reflections: partial.reflections ?? [],
      episodicEvents: partial.episodicEvents ?? [],
      personalityDriftHistory: partial.personalityDriftHistory ?? [],
      wallet: partial.wallet ?? 100,
      schedule: partial.schedule ?? null,
      factionId: partial.factionId ?? null,
      knownFacts: partial.knownFacts ?? [],
      lastTickMs: partial.lastTickMs ?? Date.now(),
      lodLevel: partial.lodLevel ?? 'full',
    };
    this.runtime.registerNPC(npc);
    return npc;
  }

  removeNPC(id: NPCId): void {
    this.trackCall('removeNPC');
    this.runtime.unregisterNPC(id);
  }

  getNPC(id: NPCId): NPCCore | undefined {
    this.trackCall('getNPC');
    return this.runtime.getNPC(id);
  }

  getAllNPCs(): NPCCore[] {
    this.trackCall('getAllNPCs');
    return this.runtime.getAllNPCs();
  }

  setGoal(npcId: NPCId, goal: GOAPGoal): void {
    this.trackCall('setGoal');
    const npc = this.runtime.getNPC(npcId);
    if (!npc) {
      throw new Error(`[ElysiumAPI] NPC "${npcId}" not found.`);
    }
    npc.currentGoal = goal;
    this.runtime.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-api',
      npcId,
      data: { action: 'setGoal', goalName: goal.name },
    });
  }

  planGoal(npcId: NPCId, worldState: GOAPWorldState): GOAPPlan | null {
    this.trackCall('planGoal');
    const npc = this.runtime.getNPC(npcId);
    if (!npc || !npc.currentGoal) {
      return null;
    }
    const plan = this.runtime.goapPlanner.plan(npc, npc.currentGoal, worldState);
    npc.currentPlan = plan;
    return plan;
  }

  tick(): void {
    this.trackCall('tick');
    this.runtime.tickAll();
    this.pluginManager.tickAll(this.runtime.getAllNPCs());
  }

  start(): void {
    this.trackCall('start');
    if (this.isRunning) return;
    this.isRunning = true;
    this.tickTimerId = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);
  }

  stop(): void {
    this.trackCall('stop');
    this.isRunning = false;
    if (this.tickTimerId !== null) {
      clearInterval(this.tickTimerId);
      this.tickTimerId = null;
    }
    this.runtime.stopAutoSimulation();
  }

  emit(event: Omit<CognitiveEvent, 'id' | 'timestamp'>): void {
    this.trackCall('emit');
    this.runtime.eventBus.emit(event);
  }

  subscribe(eventType: CognitiveEventType, handler: EventHandler): string {
    this.trackCall('subscribe');
    const id = generateSubId();
    const runtimeSubId = this.runtime.eventBus.subscribe(eventType, handler);
    this.subscriptions.set(id, { id, eventType, handler });
    return runtimeSubId;
  }

  unsubscribe(id: string): void {
    this.trackCall('unsubscribe');
    this.runtime.eventBus.unsubscribe(id);
    this.subscriptions.delete(id);
  }

  getWorldState() {
    this.trackCall('getWorldState');
    return this.runtime.getWorldState();
  }

  triggerWorldEvent(type: WorldEventType) {
    this.trackCall('triggerWorldEvent');
    return this.runtime.worldKnowledge.triggerEvent(type);
  }

  getEconomyPrice(itemType: EconomyItemType): number {
    this.trackCall('getEconomyPrice');
    return this.runtime.economyEngine.getItemPrice(itemType);
  }

  trade(
    buyerId: NPCId,
    sellerId: NPCId,
    itemType: EconomyItemType,
    quantity: number,
  ): EconomyTransaction | null {
    this.trackCall('trade');
    return this.runtime.economyEngine.processTransaction(buyerId, sellerId, itemType, quantity);
  }

  setPlayerPosition(pos: Vec2): void {
    this.trackCall('setPlayerPosition');
    const npcs = this.runtime.getAllNPCs();
    this.runtime.lodAI.updateLOD(npcs, pos);
  }

  getNPCLOD(npcId: NPCId): LODLevel {
    this.trackCall('getNPCLOD');
    return this.runtime.lodAI.getLODLevel(npcId);
  }

  exportState(): string {
    this.trackCall('exportState');
    return this.runtime.exportState();
  }

  importState(json: string): void {
    this.trackCall('importState');
    this.runtime.importState(json);
  }

  getStats(): ElysiumSDKStats {
    this.trackCall('getStats');
    const pluginStats = this.pluginManager.getStats();
    return {
      registeredPlugins: pluginStats.loadedPlugins,
      registeredActions: pluginStats.registeredActions,
      registeredGoals: pluginStats.registeredGoals,
      registeredDebugPanels: this.debugPanels.getPanelCount(),
      apiCalls: this.apiCallCount,
      uptime: Date.now() - this.startTime,
    };
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  getDebugPanels(): DebugPanelRegistry {
    return this.debugPanels;
  }

  getRuntime(): ElysiumRuntime {
    return this.runtime;
  }

  private trackCall(method: string): void {
    this.apiCallCount += 1;
    this.runtime.eventBus.emit({
      type: 'API_CALLED',
      source: 'elysium-api',
      data: { method },
    });
  }
}
