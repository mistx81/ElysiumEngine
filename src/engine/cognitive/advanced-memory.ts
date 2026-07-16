import type { CognitiveEventBus } from './event-bus';
import type {
  MemoryType,
  MemoryRecord,
  MemorySystem,
  NPCCore,
  EmotionLabel,
  CognitiveEventType,
} from '../types';

const DECAY_RATES: Record<MemoryType, number> = {
  working: 0.1,
  short: 0.05,
  long: 0.01,
  semantic: 0.005,
  procedural: 0.005,
  flashbulb: 0.001,
  trauma: 0.002,
};

const CONSOLIDATION_MAP: Partial<Record<MemoryType, MemoryType>> = {
  working: 'short',
  short: 'long',
};

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `mem_${Date.now()}_${idCounter}`;
}

function ensureMemorySystem(npc: NPCCore): MemorySystem {
  if (!npc.memories) {
    npc.memories = {
      working: [],
      short: [],
      long: [],
      semantic: [],
      procedural: [],
      flashbulb: [],
      trauma: [],
    };
  }
  return npc.memories;
}

function extractEmotionLabels(npc: NPCCore): EmotionLabel[] {
  const labels: EmotionLabel[] = [];
  const emotions = npc.emotions?.emotions;
  if (emotions) {
    (Object.keys(emotions) as EmotionLabel[]).forEach((key) => {
      if (emotions[key] > 50) {
        labels.push(key);
      }
    });
  }
  return labels;
}

export class AdvancedMemorySystem {
  private eventBus: CognitiveEventBus;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  formMemory(
    npc: NPCCore,
    type: MemoryType,
    content: string,
    importance: number,
    emotionalWeight: number,
    relatedNPCs: string[] = [],
  ): MemoryRecord {
    const memSystem = ensureMemorySystem(npc);
    const now = Date.now();

    const record: MemoryRecord = {
      id: generateId(),
      type,
      content,
      timestamp: now,
      importance: Math.max(0, Math.min(1, importance)),
      emotionalWeight: Math.max(-1, Math.min(1, emotionalWeight)),
      decayRate: DECAY_RATES[type],
      lastAccessed: now,
      accessCount: 0,
      relatedNPCs: relatedNPCs,
      relatedEmotions: extractEmotionLabels(npc),
      consolidationTarget: CONSOLIDATION_MAP[type],
    };

    memSystem[type].push(record);

    this.eventBus.emit({
      type: 'MEMORY_FORMED' as CognitiveEventType,
      source: 'advanced-memory',
      npcId: npc.id,
      data: { memoryId: record.id, type, content, importance },
    });

    return record;
  }

  consolidateMemories(npc: NPCCore): void {
    const memSystem = ensureMemorySystem(npc);
    const now = Date.now();

    for (const typeStr of Object.keys(memSystem)) {
      const type = typeStr as MemoryType;
      const records = memSystem[type];
      const target = CONSOLIDATION_MAP[type];

      if (!target) continue;

      const toConsolidate = records.filter(
        (r) =>
          r.importance > 0.5 &&
          r.accessCount > 2 &&
          now - r.timestamp > 5000,
      );

      for (const record of toConsolidate) {
        const consolidated: MemoryRecord = {
          ...record,
          id: generateId(),
          type: target,
          decayRate: DECAY_RATES[target],
          consolidationTarget: CONSOLIDATION_MAP[target],
          timestamp: now,
        };

        memSystem[target].push(consolidated);

        const idx = memSystem[type].indexOf(record);
        if (idx >= 0) {
          memSystem[type].splice(idx, 1);
        }

        this.eventBus.emit({
          type: 'MEMORY_CONSOLIDATED' as CognitiveEventType,
          source: 'advanced-memory',
          npcId: npc.id,
          data: {
            memoryId: consolidated.id,
            fromType: type,
            toType: target,
          },
        });
      }
    }
  }

  decayMemories(npc: NPCCore): void {
    const memSystem = ensureMemorySystem(npc);
    const now = Date.now();

    for (const typeStr of Object.keys(memSystem)) {
      const type = typeStr as MemoryType;
      const records = memSystem[type];
      const surviving: MemoryRecord[] = [];

      for (const record of records) {
        const elapsed = (now - record.lastAccessed) / 1000;
        const decayAmount = record.decayRate * elapsed;
        const retention =
          record.importance * (1 - decayAmount) +
          Math.abs(record.emotionalWeight) * 0.1;

        if (retention > 0.05) {
          surviving.push(record);
        } else {
          this.eventBus.emit({
            type: 'MEMORY_DECAYED' as CognitiveEventType,
            source: 'advanced-memory',
            npcId: npc.id,
            data: { memoryId: record.id, type, retention },
          });
        }
      }

      memSystem[type] = surviving;
    }
  }

  recallMemories(
    npc: NPCCore,
    query: string,
    limit: number = 10,
  ): MemoryRecord[] {
    const memSystem = ensureMemorySystem(npc);
    const now = Date.now();
    const queryLower = query.toLowerCase();
    const allRecords: MemoryRecord[] = [];

    for (const typeStr of Object.keys(memSystem)) {
      const type = typeStr as MemoryType;
      allRecords.push(...memSystem[type]);
    }

    const matches = allRecords
      .filter((r) => r.content.toLowerCase().includes(queryLower))
      .map((r) => {
        const recency = 1 / (1 + (now - r.lastAccessed) / 1000);
        const relevance = r.content.toLowerCase().includes(queryLower)
          ? 1
          : 0;
        const score =
          r.importance * 0.4 +
          Math.abs(r.emotionalWeight) * 0.3 +
          recency * 0.2 +
          relevance * 0.1;
        return { record: r, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => {
        entry.record.lastAccessed = now;
        entry.record.accessCount += 1;
        return entry.record;
      });

    this.eventBus.emit({
      type: 'MEMORY_RECALLED' as CognitiveEventType,
      source: 'advanced-memory',
      npcId: npc.id,
      data: { query, count: matches.length, limit },
    });

    return matches;
  }

  getMemoryStats(npc: NPCCore): {
    byType: Record<MemoryType, number>;
    total: number;
    avgImportance: number;
    avgEmotionalWeight: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const memSystem = ensureMemorySystem(npc);
    const byType: Record<MemoryType, number> = {
      working: 0,
      short: 0,
      long: 0,
      semantic: 0,
      procedural: 0,
      flashbulb: 0,
      trauma: 0,
    };

    let total = 0;
    let importanceSum = 0;
    let emotionalSum = 0;
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const typeStr of Object.keys(memSystem)) {
      const type = typeStr as MemoryType;
      const records = memSystem[type];
      byType[type] = records.length;

      for (const r of records) {
        total += 1;
        importanceSum += r.importance;
        emotionalSum += Math.abs(r.emotionalWeight);
        if (oldest === null || r.timestamp < oldest) oldest = r.timestamp;
        if (newest === null || r.timestamp > newest) newest = r.timestamp;
      }
    }

    return {
      byType,
      total,
      avgImportance: total > 0 ? importanceSum / total : 0,
      avgEmotionalWeight: total > 0 ? emotionalSum / total : 0,
      oldestTimestamp: oldest,
      newestTimestamp: newest,
    };
  }
}

export { DECAY_RATES };
