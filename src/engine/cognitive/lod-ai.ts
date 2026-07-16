import type {
  LODLevel,
  LODConfig,
  LODConfigMap,
  LODStats,
  NPCCore,
  Vec2,
} from '../types';
import type { CognitiveEventBus } from './event-bus';

export const LOD_CONFIGS: LODConfigMap = {
  full: {
    level: 'full',
    tickIntervalMs: 5000,
    enabledModules: [
      'pad',
      'memory',
      'goap',
      'utility',
      'relationship',
      'social',
      'economy',
      'prediction',
      'reflection',
      'personality',
      'episodic',
    ],
    memoryDecayRate: 1,
    emotionDecayRate: 1,
    maxThoughtsPerTick: 5,
    enableSocial: true,
    enableTrading: true,
  },
  reduced: {
    level: 'reduced',
    tickIntervalMs: 10000,
    enabledModules: ['pad', 'memory', 'goap', 'utility', 'relationship'],
    memoryDecayRate: 0.5,
    emotionDecayRate: 0.5,
    maxThoughtsPerTick: 3,
    enableSocial: true,
    enableTrading: false,
  },
  minimal: {
    level: 'minimal',
    tickIntervalMs: 30000,
    enabledModules: ['pad', 'memory'],
    memoryDecayRate: 0.2,
    emotionDecayRate: 0.2,
    maxThoughtsPerTick: 1,
    enableSocial: false,
    enableTrading: false,
  },
  dormant: {
    level: 'dormant',
    tickIntervalMs: 0,
    enabledModules: [],
    memoryDecayRate: 0,
    emotionDecayRate: 0,
    maxThoughtsPerTick: 0,
    enableSocial: false,
    enableTrading: false,
  },
};

const FULL_THRESHOLD = 500;
const REDUCED_THRESHOLD = 1500;
const MINIMAL_THRESHOLD = 5000;

export class LODAIEngine {
  private eventBus: CognitiveEventBus;

  private npcLevels: Map<string, LODLevel> = new Map();
  private totalChanges = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  updateLOD(npcs: NPCCore[], playerPos: Vec2): void {
    for (const npc of npcs) {
      const newLevel = this.calculateLOD(npc.position, playerPos);
      const currentLevel = this.npcLevels.get(npc.id) ?? 'full';

      if (currentLevel !== newLevel) {
        this.npcLevels.set(npc.id, newLevel);
        npc.lodLevel = newLevel;
        this.totalChanges += 1;

        this.eventBus.emit({
          type: 'LOD_CHANGED',
          source: 'lod-ai-engine',
          npcId: npc.id,
          data: {
            oldLevel: currentLevel,
            newLevel,
            distance: this.distance(npc.position, playerPos),
          },
        });
      }
    }
  }

  calculateLOD(npcPos: Vec2, playerPos: Vec2): LODLevel {
    const dist = this.distance(npcPos, playerPos);

    if (dist < FULL_THRESHOLD) return 'full';
    if (dist < REDUCED_THRESHOLD) return 'reduced';
    if (dist < MINIMAL_THRESHOLD) return 'minimal';
    return 'dormant';
  }

  isModuleEnabled(npcId: string, module: string): boolean {
    const level = this.npcLevels.get(npcId);
    if (level === undefined) return true;
    const config = LOD_CONFIGS[level];
    return config.enabledModules.includes(module);
  }

  getLODLevel(npcId: string): LODLevel {
    return this.npcLevels.get(npcId) ?? 'full';
  }

  getStats(): LODStats {
    let fullCount = 0;
    let reducedCount = 0;
    let minimalCount = 0;
    let dormantCount = 0;

    for (const level of this.npcLevels.values()) {
      switch (level) {
        case 'full':
          fullCount += 1;
          break;
        case 'reduced':
          reducedCount += 1;
          break;
        case 'minimal':
          minimalCount += 1;
          break;
        case 'dormant':
          dormantCount += 1;
          break;
      }
    }

    return {
      totalNPCs: this.npcLevels.size,
      fullCount,
      reducedCount,
      minimalCount,
      dormantCount,
      totalChanges: this.totalChanges,
    };
  }

  setNPCLOD(npcId: string, level: LODLevel): void {
    const currentLevel = this.npcLevels.get(npcId) ?? 'full';
    if (currentLevel !== level) {
      this.npcLevels.set(npcId, level);
      this.totalChanges += 1;

      this.eventBus.emit({
        type: 'LOD_CHANGED',
        source: 'lod-ai-engine',
        npcId,
        data: {
          oldLevel: currentLevel,
          newLevel: level,
          manual: true,
        },
      });
    }
  }

  private distance(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
