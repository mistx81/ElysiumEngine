import type {
  NPCId,
  NPCCore,
  CognitiveEvent,
  CognitiveEventType,
  LogLevel,
  LogEntry,
  LODLevel,
  WorldState,
  EconomyItem,
  GossipItem,
  Faction,
  BackgroundStats,
  CacheStats,
  BatchWriteStats,
  PersistenceStats,
  SchedulerStats,
  LODStats,
  ChunkStats,
  PerformanceStats,
  EconomyItemType,
} from './types';
import {
  CognitiveEventBus,
  PADEmotionEngine,
  AdvancedMemorySystem,
  GOAPPlanner,
  UtilityAIEngine,
  PredictionEngine,
  PersonalityDriftEngine,
  RelationshipGraph,
  EpisodicTimeline,
  ReflectionSystem,
  EconomyEngine,
  ScheduleEngine,
  SocialSimulation,
  WorldKnowledge,
  BackgroundSimulation,
  CacheSystem,
  BatchWriteSystem,
  IncrementalPersistence,
  LODAIEngine,
  ChunkSimulationEngine,
  PerformanceScheduler,
} from './cognitive/index';

const ALL_EVENT_TYPES: CognitiveEventType[] = [
  'EMOTION_CHANGED',
  'MEMORY_FORMED',
  'MEMORY_CONSOLIDATED',
  'MEMORY_DECAYED',
  'MEMORY_RECALLED',
  'NEED_CHANGED',
  'GOAL_COMPLETED',
  'GOAL_FAILED',
  'STATE_CHANGED',
  'GOAP_PLAN_REQUESTED',
  'GOAP_PLAN_FOUND',
  'GOAP_PLAN_FAILED',
  'GOAP_PLAN_CACHED',
  'GOAP_PLAN_REPAIRED',
  'UTILITY_SCORED',
  'DECISION_MADE',
  'PREDICTION_MADE',
  'PREDICTION_VERIFIED',
  'PERSONALITY_DRIFTED',
  'RELATIONSHIP_CHANGED',
  'RELATIONSHIP_RIPPLE',
  'REFLECTION_STARTED',
  'REFLECTION_COMPLETED',
  'EPISODIC_ADDED',
  'EPISODIC_RECALLED',
  'ECONOMY_TRANSACTION',
  'ECONOMY_PRICE_UPDATE',
  'SCHEDULE_TICK',
  'SCHEDULE_TASK_STARTED',
  'SCHEDULE_TASK_COMPLETED',
  'SOCIAL_INTERACTION',
  'SOCIAL_REPUTATION_CHANGED',
  'SOCIAL_GOSSIP_SPREAD',
  'WORLD_EVENT',
  'WORLD_FACT_LEARNED',
  'WORLD_TIME_CHANGED',
  'WORLD_WEATHER_CHANGED',
  'BACKGROUND_TICK',
  'BACKGROUND_PHASE_COMPLETED',
  'CACHE_HIT',
  'CACHE_MISS',
  'CACHE_EVICTED',
  'BATCH_WRITE_FLUSHED',
  'PERSISTENCE_CHECKPOINT',
  'PERSISTENCE_DIRTY',
  'PERSISTENCE_SAVED',
  'LOD_CHANGED',
  'CHUNK_LOADED',
  'CHUNK_UNLOADED',
  'CHUNK_TICK',
  'SCHEDULE_TASK_QUEUED',
  'SCHEDULE_TASK_EXECUTED',
  'SCHEDULE_BUDGET_EXCEEDED',
  'PLUGIN_LOADED',
  'PLUGIN_UNLOADED',
  'PLUGIN_ERROR',
  'API_CALLED',
  'DEBUG_PANEL_REGISTERED',
  'DEBUG_PANEL_UNREGISTERED',
  'BENCHMARK_COMPLETED',
];

let logIdCounter = 0;

function generateLogId(): string {
  logIdCounter += 1;
  return `log_${Date.now()}_${logIdCounter}`;
}

export class ElysiumRuntime {
  public eventBus: CognitiveEventBus;
  public padEmotion: PADEmotionEngine;
  public memorySystem: AdvancedMemorySystem;
  public goapPlanner: GOAPPlanner;
  public utilityAI: UtilityAIEngine;
  public predictionEngine: PredictionEngine;
  public personalityDrift: PersonalityDriftEngine;
  public relationshipGraph: RelationshipGraph;
  public episodicTimeline: EpisodicTimeline;
  public reflectionSystem: ReflectionSystem;
  public economyEngine: EconomyEngine;
  public scheduleEngine: ScheduleEngine;
  public socialSimulation: SocialSimulation;
  public worldKnowledge: WorldKnowledge;
  public backgroundSimulation: BackgroundSimulation;
  public cacheSystem: CacheSystem;
  public batchWriter: BatchWriteSystem;
  public persistence: IncrementalPersistence;
  public lodAI: LODAIEngine;
  public chunkSimulation: ChunkSimulationEngine;
  public scheduler: PerformanceScheduler;

  public npcs: Map<NPCId, NPCCore> = new Map();

  public tickCount: number = 0;
  public lastTickMs: number = 0;
  public tickTimes: number[] = [];
  public logs: LogEntry[] = [];

  private autoSimTimerId: ReturnType<typeof setInterval> | null = null;
  private autoSimRunning: boolean = false;
  private autoSimIntervalMs: number = 5000;

  constructor() {
    this.eventBus = new CognitiveEventBus();
    this.padEmotion = new PADEmotionEngine(this.eventBus);
    this.memorySystem = new AdvancedMemorySystem(this.eventBus);
    this.goapPlanner = new GOAPPlanner(this.eventBus);
    this.utilityAI = new UtilityAIEngine(this.eventBus);
    this.predictionEngine = new PredictionEngine(this.eventBus);
    this.personalityDrift = new PersonalityDriftEngine(this.eventBus);
    this.relationshipGraph = new RelationshipGraph(this.eventBus);
    this.episodicTimeline = new EpisodicTimeline(this.eventBus);
    this.reflectionSystem = new ReflectionSystem(this.eventBus);
    this.economyEngine = new EconomyEngine(this.eventBus);
    this.scheduleEngine = new ScheduleEngine(this.eventBus);
    this.socialSimulation = new SocialSimulation(this.eventBus);
    this.worldKnowledge = new WorldKnowledge(this.eventBus);
    this.backgroundSimulation = new BackgroundSimulation(
      this.eventBus,
      this.worldKnowledge,
      this.economyEngine,
      this.scheduleEngine,
      this.socialSimulation,
    );
    this.cacheSystem = new CacheSystem(this.eventBus);
    this.batchWriter = new BatchWriteSystem(this.eventBus);
    this.persistence = new IncrementalPersistence(this.eventBus, this.batchWriter);
    this.lodAI = new LODAIEngine(this.eventBus);
    this.chunkSimulation = new ChunkSimulationEngine(this.eventBus);
    this.scheduler = new PerformanceScheduler(this.eventBus);

    this.wireEvents();
    this.registerSchedulerTasks();
  }

  registerNPC(npc: NPCCore): void {
    this.npcs.set(npc.id, npc);

    this.scheduleEngine.generateSchedule(npc);

    npc.wallet = 100;
    this.economyEngine.setNPCWallet(npc.id, 100);

    this.chunkSimulation.assignNPCToChunk(npc);

    this.lodAI.setNPCLOD(npc.id, npc.lodLevel ?? 'full');

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId: npc.id,
      data: { action: 'register', npcId: npc.id },
    });
  }

  unregisterNPC(npcId: NPCId): void {
    const npc = this.npcs.get(npcId);
    this.npcs.delete(npcId);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { action: 'unregister', npcId },
    });
  }

  getNPC(id: NPCId): NPCCore | undefined {
    return this.npcs.get(id);
  }

  getAllNPCs(): NPCCore[] {
    return [...this.npcs.values()];
  }

  cognitiveTick(npc: NPCCore): void {
    const start = performance.now();

    this.padEmotion.decayEmotion(npc, 0.05);

    this.memorySystem.decayMemories(npc);

    if (npc.currentGoal) {
      const worldState: Record<string, any> = {
        hunger: npc.needs.hunger,
        thirst: npc.needs.thirst,
        sleep: npc.needs.sleep,
        social: npc.needs.social,
        safety: npc.needs.safety,
        energy: 100 - npc.needs.sleep,
        hasFood: npc.needs.hunger < 50,
        hasWater: npc.needs.thirst < 50,
        isSafe: npc.needs.safety > 50,
        hasMoney: npc.wallet > 0,
        hasWeapon: false,
        hasMaterials: false,
        hasBook: false,
        nearNPC: false,
        nearResource: false,
        isThreatened: npc.needs.safety < 30,
      };
      const plan = this.goapPlanner.plan(npc, npc.currentGoal, worldState);
      npc.currentPlan = plan;
    }

    const decision = this.utilityAI.scoreActions(npc);
    npc.currentAction = decision.action;

    const prediction = this.predictionEngine.predict(npc);
    if (npc.predictions) {
      npc.predictions.push(prediction);
    } else {
      npc.predictions = [prediction];
    }

    this.episodicTimeline.addEvent(
      npc.id,
      'cognitive_tick',
      `Cognitive tick: ${decision.action} (score ${decision.score.toFixed(2)})`,
      npc.emotions.pad.pleasure,
      [],
      'unknown',
    );

    npc.lastTickMs = Date.now();

    const elapsed = performance.now() - start;
    this.lastTickMs = elapsed;
    this.tickTimes.push(elapsed);
    if (this.tickTimes.length > 100) {
      this.tickTimes.shift();
    }
  }

  cognitiveTickLOD(npc: NPCCore, lodLevel: LODLevel): void {
    if (lodLevel === 'dormant') return;

    if (this.lodAI.isModuleEnabled(npc.id, 'pad')) {
      this.padEmotion.decayEmotion(npc, 0.05);
    }

    if (this.lodAI.isModuleEnabled(npc.id, 'memory')) {
      this.memorySystem.decayMemories(npc);
    }

    if (this.lodAI.isModuleEnabled(npc.id, 'goap') && npc.currentGoal) {
      const worldState: Record<string, any> = {
        hunger: npc.needs.hunger,
        thirst: npc.needs.thirst,
        sleep: npc.needs.sleep,
        social: npc.needs.social,
        safety: npc.needs.safety,
        energy: 100 - npc.needs.sleep,
        hasFood: npc.needs.hunger < 50,
        hasWater: npc.needs.thirst < 50,
        isSafe: npc.needs.safety > 50,
        hasMoney: npc.wallet > 0,
        hasWeapon: false,
        hasMaterials: false,
        hasBook: false,
        nearNPC: false,
        nearResource: false,
        isThreatened: npc.needs.safety < 30,
      };
      const plan = this.goapPlanner.plan(npc, npc.currentGoal, worldState);
      npc.currentPlan = plan;
    }

    if (this.lodAI.isModuleEnabled(npc.id, 'utility')) {
      const decision = this.utilityAI.scoreActions(npc);
      npc.currentAction = decision.action;
    }

    if (this.lodAI.isModuleEnabled(npc.id, 'prediction')) {
      const prediction = this.predictionEngine.predict(npc);
      if (npc.predictions) {
        npc.predictions.push(prediction);
      } else {
        npc.predictions = [prediction];
      }
    }

    if (this.lodAI.isModuleEnabled(npc.id, 'episodic')) {
      this.episodicTimeline.addEvent(
        npc.id,
        'cognitive_tick_lod',
        `LOD tick (${lodLevel}): ${npc.currentAction ?? 'idle'}`,
        npc.emotions.pad.pleasure,
        [],
        'unknown',
      );
    }

    npc.lastTickMs = Date.now();

    const elapsed = performance.now();
    this.lastTickMs = elapsed;
    this.tickTimes.push(elapsed);
    if (this.tickTimes.length > 100) {
      this.tickTimes.shift();
    }
  }

  tickAll(): void {
    const start = performance.now();

    for (const npc of this.npcs.values()) {
      if (!npc.isAlive) continue;

      const lodLevel = npc.lodLevel ?? 'full';
      if (lodLevel === 'full') {
        this.cognitiveTick(npc);
      } else {
        this.cognitiveTickLOD(npc, lodLevel);
      }
    }

    this.tickCount += 1;

    const elapsed = performance.now() - start;
    this.lastTickMs = elapsed;
    this.tickTimes.push(elapsed);
    if (this.tickTimes.length > 100) {
      this.tickTimes.shift();
    }
  }

  startAutoSimulation(intervalMs?: number): void {
    if (this.autoSimRunning) return;
    this.autoSimRunning = true;
    if (intervalMs !== undefined) {
      this.autoSimIntervalMs = intervalMs;
    }
    this.autoSimTimerId = setInterval(() => {
      this.tickAll();
    }, this.autoSimIntervalMs);
  }

  stopAutoSimulation(): void {
    this.autoSimRunning = false;
    if (this.autoSimTimerId !== null) {
      clearInterval(this.autoSimTimerId);
      this.autoSimTimerId = null;
    }
  }

  isAutoRunning(): boolean {
    return this.autoSimRunning;
  }

  private wireEvents(): void {
    for (const eventType of ALL_EVENT_TYPES) {
      this.eventBus.subscribe(eventType, (event: CognitiveEvent) => {
        this.log('debug', `${event.type} from ${event.source}`, 'event-bus', event.npcId);
      });
    }

    this.eventBus.subscribe('GOAL_COMPLETED', (event: CognitiveEvent) => {
      if (event.npcId) {
        const npc = this.npcs.get(event.npcId);
        if (npc) {
          npc.currentGoal = null;
          npc.currentPlan = null;
        }
      }
    });

    this.eventBus.subscribe('GOAL_FAILED', (event: CognitiveEvent) => {
      if (event.npcId) {
        const npc = this.npcs.get(event.npcId);
        if (npc) {
          npc.currentGoal = null;
          npc.currentPlan = null;
        }
      }
    });

    this.eventBus.subscribe('PERSONALITY_DRIFTED', (event: CognitiveEvent) => {
      if (event.npcId && event.data?.personality) {
        const npc = this.npcs.get(event.npcId);
        if (npc) {
          npc.personality = { ...event.data.personality };
        }
      }
    });

    this.eventBus.subscribe('RELATIONSHIP_CHANGED', (event: CognitiveEvent) => {
      if (event.npcId) {
        const npc = this.npcs.get(event.npcId);
        if (npc) {
          npc.relationships = this.relationshipGraph.getAllRelationships(event.npcId);
        }
      }
    });

    this.eventBus.subscribe('LOD_CHANGED', (event: CognitiveEvent) => {
      if (event.npcId && event.data?.newLevel) {
        const npc = this.npcs.get(event.npcId);
        if (npc) {
          npc.lodLevel = event.data.newLevel as LODLevel;
        }
      }
    });
  }

  log(level: LogLevel, message: string, source: string, npcId?: NPCId): void {
    const entry: LogEntry = {
      id: generateLogId(),
      level,
      message,
      timestamp: Date.now(),
      source,
      npcId,
    };
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  private registerSchedulerTasks(): void {
    this.scheduler.registerTask(
      'pad-decay',
      'PAD Emotion Decay',
      10,
      5000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          this.padEmotion.decayEmotion(npc, 0.05);
        }
      },
    );

    this.scheduler.registerTask(
      'memory-decay',
      'Memory Decay',
      20,
      10000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          this.memorySystem.decayMemories(npc);
        }
      },
    );

    this.scheduler.registerTask(
      'goap-planning',
      'GOAP Planning',
      15,
      5000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive || !npc.currentGoal) continue;
          if (!this.lodAI.isModuleEnabled(npc.id, 'goap')) continue;
          const worldState: Record<string, any> = {
            hunger: npc.needs.hunger,
            thirst: npc.needs.thirst,
            sleep: npc.needs.sleep,
            social: npc.needs.social,
            safety: npc.needs.safety,
            energy: 100 - npc.needs.sleep,
            hasFood: npc.needs.hunger < 50,
            hasWater: npc.needs.thirst < 50,
            isSafe: npc.needs.safety > 50,
            hasMoney: npc.wallet > 0,
            hasWeapon: false,
            hasMaterials: false,
            hasBook: false,
            nearNPC: false,
            nearResource: false,
            isThreatened: npc.needs.safety < 30,
          };
          const plan = this.goapPlanner.plan(npc, npc.currentGoal, worldState);
          npc.currentPlan = plan;
        }
      },
    );

    this.scheduler.registerTask(
      'utility-scoring',
      'Utility Scoring',
      12,
      3000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          if (!this.lodAI.isModuleEnabled(npc.id, 'utility')) continue;
          const decision = this.utilityAI.scoreActions(npc);
          npc.currentAction = decision.action;
        }
      },
    );

    this.scheduler.registerTask(
      'prediction',
      'Prediction Engine',
      30,
      10000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          if (!this.lodAI.isModuleEnabled(npc.id, 'prediction')) continue;
          const prediction = this.predictionEngine.predict(npc);
          if (npc.predictions) {
            npc.predictions.push(prediction);
          } else {
            npc.predictions = [prediction];
          }
        }
      },
    );

    this.scheduler.registerTask(
      'drift',
      'Personality Drift',
      40,
      15000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          if (!this.lodAI.isModuleEnabled(npc.id, 'personality')) continue;
        }
      },
    );

    this.scheduler.registerTask(
      'reflection',
      'Reflection System',
      50,
      20000,
      () => {
        for (const npc of this.npcs.values()) {
          if (!npc.isAlive) continue;
          if (!this.lodAI.isModuleEnabled(npc.id, 'reflection')) continue;
          this.reflectionSystem.triggerReflection(npc);
        }
      },
    );

    this.scheduler.registerTask(
      'lod-update',
      'LOD Update',
      5,
      2000,
      () => {
        const npcs = this.getAllNPCs();
        this.lodAI.updateLOD(npcs, { x: 0, y: 0 });
      },
    );

    this.scheduler.registerTask(
      'chunk-tick',
      'Chunk Simulation Tick',
      8,
      1000,
      () => {
        this.chunkSimulation.processChunks((npcIds, lodLevel) => {
          for (const npcId of npcIds) {
            const npc = this.npcs.get(npcId);
            if (!npc || !npc.isAlive) continue;
            this.cognitiveTickLOD(npc, lodLevel);
          }
        });
      },
    );
  }

  triggerBetrayal(npcId: NPCId, targetId: NPCId): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    this.personalityDrift.processExperience(npc, 'betrayal', 2);
    this.padEmotion.processEmotion(npc, {
      padDelta: { pleasure: -0.5, arousal: 0.6, dominance: -0.3 },
      source: 'betrayal',
    });

    this.relationshipGraph.updateRelationship(
      npcId,
      targetId,
      { trust: -30, affinity: -20 },
      'betrayal',
    );

    this.episodicTimeline.addEvent(
      npcId,
      'betrayal',
      `${npcId} betrayed by ${targetId}`,
      -0.8,
      [targetId],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'trauma', `Betrayed by ${targetId}`, 0.9, -0.8, [targetId]);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'betrayal', targetId },
    });
  }

  triggerConversation(npcId: NPCId, targetId: NPCId): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    this.socialSimulation.initiateInteraction(npcId, targetId, 'conversation');

    this.padEmotion.processEmotion(npc, {
      padDelta: { pleasure: 0.1, arousal: 0.05, dominance: 0 },
      source: 'conversation',
    });

    this.relationshipGraph.updateRelationship(
      npcId,
      targetId,
      { familiarity: 5 },
      'conversation',
    );

    this.episodicTimeline.addEvent(
      npcId,
      'conversation',
      `${npcId} had a conversation with ${targetId}`,
      0.2,
      [targetId],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'short', `Conversation with ${targetId}`, 0.3, 0.2, [targetId]);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'conversation', targetId },
    });
  }

  triggerItemFound(npcId: NPCId, itemType: EconomyItemType): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    this.padEmotion.processEmotion(npc, {
      padDelta: { pleasure: 0.3, arousal: 0.2, dominance: 0.1 },
      source: 'item_found',
    });

    this.episodicTimeline.addEvent(
      npcId,
      'item_found',
      `${npcId} found ${itemType}`,
      0.5,
      [],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'short', `Found ${itemType}`, 0.4, 0.5, []);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'item_found', itemType },
    });
  }

  triggerAttack(npcId: NPCId, targetId: NPCId): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    this.socialSimulation.initiateInteraction(npcId, targetId, 'threat');

    this.padEmotion.processEmotion(npc, {
      padDelta: { pleasure: -0.3, arousal: 0.7, dominance: 0.2 },
      source: 'attack',
    });

    this.relationshipGraph.updateRelationship(
      npcId,
      targetId,
      { trust: -20, affinity: -15 },
      'attack',
    );

    this.episodicTimeline.addEvent(
      npcId,
      'attack',
      `${npcId} attacked ${targetId}`,
      -0.6,
      [targetId],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'trauma', `Attacked ${targetId}`, 0.7, -0.6, [targetId]);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'attack', targetId },
    });
  }

  triggerReward(npcId: NPCId, amount: number): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    npc.wallet += amount;
    this.economyEngine.setNPCWallet(npcId, npc.wallet);

    this.padEmotion.processEmotion(npc, {
      padDelta: { pleasure: 0.3, arousal: 0.1, dominance: 0.1 },
      source: 'reward',
    });

    this.personalityDrift.processExperience(npc, 'success', 1);

    this.episodicTimeline.addEvent(
      npcId,
      'reward',
      `${npcId} received reward of ${amount}`,
      0.6,
      [],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'short', `Received reward of ${amount}`, 0.5, 0.6, []);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'reward', amount },
    });
  }

  triggerRumor(npcId: NPCId, topic: string, targetId: NPCId): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    const allNpcIds = [...this.npcs.keys()].filter((id) => id !== npcId);
    this.socialSimulation.spreadGossip(npcId, targetId, topic, 0.5, allNpcIds);

    this.episodicTimeline.addEvent(
      npcId,
      'rumor',
      `${npcId} spread rumor about ${targetId}: ${topic}`,
      -0.1,
      [targetId],
      'unknown',
    );

    this.memorySystem.formMemory(npc, 'short', `Rumor about ${targetId}: ${topic}`, 0.3, -0.1, [targetId]);

    this.eventBus.emit({
      type: 'STATE_CHANGED',
      source: 'elysium-runtime',
      npcId,
      data: { trigger: 'rumor', topic, targetId },
    });
  }

  getWorldState(): WorldState {
    return this.worldKnowledge.getWorldState();
  }

  getEconomyInventory(): EconomyItem[] {
    return this.economyEngine.getInventory();
  }

  getActiveGossip(): GossipItem[] {
    return this.socialSimulation.getActiveGossip();
  }

  getFactions(): Faction[] {
    return this.socialSimulation.getFactions();
  }

  getBackgroundStats(): BackgroundStats {
    return this.backgroundSimulation.getStats();
  }

  startBackground(intervalMs?: number): void {
    const npcs = this.getAllNPCs();
    this.backgroundSimulation.start(npcs, intervalMs);
  }

  stopBackground(): void {
    this.backgroundSimulation.stop();
  }

  manualBgTick(): BackgroundStats {
    const npcs = this.getAllNPCs();
    return this.backgroundSimulation.tick(npcs);
  }

  getCacheStats(): CacheStats {
    return this.cacheSystem.getStats();
  }

  getBatchWriteStats(): BatchWriteStats {
    return this.batchWriter.getStats();
  }

  getPersistenceStats(): PersistenceStats {
    return this.persistence.getStats();
  }

  getSchedulerStats(): SchedulerStats {
    return this.scheduler.getStats();
  }

  getLODStats(): LODStats {
    return this.lodAI.getStats();
  }

  getChunkStats(): ChunkStats {
    return this.chunkSimulation.getStats();
  }

  exportState(): string {
    const npcs = this.getAllNPCs();
    const events = this.eventBus.getHistory();
    return this.persistence.exportFullState(npcs, events);
  }

  importState(json: string): void {
    const state = this.persistence.importState(json);

    this.npcs.clear();
    for (const npc of state.npcs) {
      this.npcs.set(npc.id, npc);
    }

    for (const npc of state.npcs) {
      this.lodAI.setNPCLOD(npc.id, npc.lodLevel ?? 'full');
      this.chunkSimulation.assignNPCToChunk(npc);
      this.economyEngine.setNPCWallet(npc.id, npc.wallet ?? 100);
    }
  }

  getPerformanceStats(): PerformanceStats {
    const avgTickMs = this.tickTimes.length > 0
      ? this.tickTimes.reduce((sum, t) => sum + t, 0) / this.tickTimes.length
      : 0;
    const maxTickMs = this.tickTimes.length > 0
      ? Math.max(...this.tickTimes)
      : 0;

    return {
      tickCount: this.tickCount,
      lastTickMs: this.lastTickMs,
      avgTickMs,
      maxTickMs,
      totalEvents: this.eventBus.getHistory().length,
      activeNPCs: this.npcs.size,
    };
  }

  getEventHistory(): CognitiveEvent[] {
    return this.eventBus.getHistory();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
