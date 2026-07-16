import type {
  NPCCore,
  CognitiveEvent,
  PersistenceCheckpoint,
  PersistenceStats,
  PersistenceConfig,
} from '../types';
import type { CognitiveEventBus } from './event-bus';
import type { BatchWriteSystem } from './batch-writes';

const DEFAULT_AUTO_SAVE_INTERVAL_MS = 30000;
const DEFAULT_MAX_CHECKPOINTS = 20;

export class IncrementalPersistence {
  private eventBus: CognitiveEventBus;
  private batchWriter: BatchWriteSystem;

  private autoSaveIntervalMs: number = DEFAULT_AUTO_SAVE_INTERVAL_MS;
  private maxCheckpoints: number = DEFAULT_MAX_CHECKPOINTS;

  private dirtyNPCs: Set<string> = new Set();
  private checkpoints: PersistenceCheckpoint[] = [];
  private autoSaveTimerId: ReturnType<typeof setInterval> | null = null;
  private autoSaveRunning = false;

  private totalNPCsPersisted = 0;
  private totalEventsPersisted = 0;
  private lastCheckpointMs = 0;
  private totalCheckpointMs = 0;
  private checkpointCount = 0;

  constructor(eventBus: CognitiveEventBus, batchWriter: BatchWriteSystem) {
    this.eventBus = eventBus;
    this.batchWriter = batchWriter;
  }

  checkpoint(npcs: NPCCore[], events: CognitiveEvent[]): PersistenceCheckpoint {
    const start = performance.now();

    const state = this.exportFullState(npcs, events);
    const sizeBytes = state.length * 2;

    const checkpoint: PersistenceCheckpoint = {
      id: `ckpt_${Date.now()}_${this.checkpoints.length + 1}`,
      timestamp: Date.now(),
      npcCount: npcs.length,
      eventCount: events.length,
      sizeBytes,
    };

    this.checkpoints.push(checkpoint);
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }

    this.totalNPCsPersisted += npcs.length;
    this.totalEventsPersisted += events.length;
    this.checkpointCount += 1;
    this.lastCheckpointMs = performance.now() - start;
    this.totalCheckpointMs += this.lastCheckpointMs;

    this.batchWriter.enqueue('checkpoints', 'insert', checkpoint, 10);

    this.eventBus.emit({
      type: 'PERSISTENCE_CHECKPOINT',
      source: 'incremental-persistence',
      data: {
        checkpointId: checkpoint.id,
        npcCount: checkpoint.npcCount,
        eventCount: checkpoint.eventCount,
        sizeBytes: checkpoint.sizeBytes,
        durationMs: this.lastCheckpointMs,
      },
    });

    return checkpoint;
  }

  exportFullState(npcs: NPCCore[], events: CognitiveEvent[]): string {
    const state = {
      version: 1,
      timestamp: Date.now(),
      npcs: npcs.map((npc) => this.serializeNPC(npc)),
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp,
        source: e.source,
        npcId: e.npcId,
        data: e.data,
      })),
    };
    return JSON.stringify(state);
  }

  importState(json: string): { npcs: NPCCore[]; events: CognitiveEvent[] } {
    const parsed = JSON.parse(json);
    return {
      npcs: parsed.npcs as NPCCore[],
      events: parsed.events as CognitiveEvent[],
    };
  }

  startAutoSave(npcs: NPCCore[], events: CognitiveEvent[], intervalMs?: number): void {
    if (this.autoSaveRunning) return;
    this.autoSaveRunning = true;
    if (intervalMs !== undefined) {
      this.autoSaveIntervalMs = intervalMs;
    }
    this.autoSaveTimerId = setInterval(() => {
      this.checkpoint(npcs, events);
      this.eventBus.emit({
        type: 'PERSISTENCE_SAVED',
        source: 'incremental-persistence',
        data: {
          dirtyNPCs: this.dirtyNPCs.size,
          intervalMs: this.autoSaveIntervalMs,
        },
      });
      this.dirtyNPCs.clear();
    }, this.autoSaveIntervalMs);
  }

  stopAutoSave(): void {
    this.autoSaveRunning = false;
    if (this.autoSaveTimerId !== null) {
      clearInterval(this.autoSaveTimerId);
      this.autoSaveTimerId = null;
    }
  }

  getStats(): PersistenceStats {
    return {
      totalCheckpoints: this.checkpointCount,
      totalNPCsPersisted: this.totalNPCsPersisted,
      totalEventsPersisted: this.totalEventsPersisted,
      lastCheckpointMs: this.lastCheckpointMs,
      avgCheckpointMs: this.checkpointCount > 0 ? this.totalCheckpointMs / this.checkpointCount : 0,
      isRunning: this.autoSaveRunning,
      dirtyNPCs: this.dirtyNPCs.size,
    };
  }

  getCheckpoints(): PersistenceCheckpoint[] {
    return [...this.checkpoints];
  }

  markDirty(npcId: string): void {
    this.dirtyNPCs.add(npcId);
    this.eventBus.emit({
      type: 'PERSISTENCE_DIRTY',
      source: 'incremental-persistence',
      data: { npcId, dirtyCount: this.dirtyNPCs.size },
    });
  }

  clearDirty(): void {
    this.dirtyNPCs.clear();
  }

  private serializeNPC(npc: NPCCore): any {
    return {
      id: npc.id,
      name: npc.name,
      age: npc.age,
      personality: npc.personality,
      emotions: npc.emotions,
      needs: npc.needs,
      memories: npc.memories,
      relationships: npc.relationships,
      currentGoal: npc.currentGoal,
      currentPlan: npc.currentPlan,
      currentAction: npc.currentAction,
      position: npc.position,
      isAlive: npc.isAlive,
      thoughtHistory: npc.thoughtHistory,
      decisionHistory: npc.decisionHistory,
      predictions: npc.predictions,
      reflections: npc.reflections,
      episodicEvents: npc.episodicEvents,
      personalityDriftHistory: npc.personalityDriftHistory,
      wallet: npc.wallet,
      schedule: npc.schedule,
      factionId: npc.factionId,
      knownFacts: npc.knownFacts,
      lastTickMs: npc.lastTickMs,
      lodLevel: npc.lodLevel,
    };
  }
}

export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  autoSaveIntervalMs: DEFAULT_AUTO_SAVE_INTERVAL_MS,
  maxCheckpoints: DEFAULT_MAX_CHECKPOINTS,
};
