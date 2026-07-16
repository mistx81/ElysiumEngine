import type {
  SimulationChunk,
  ChunkStats,
  ChunkConfig,
  ChunkCoord,
  LODLevel,
  NPCCore,
  Vec2,
} from '../types';
import type { CognitiveEventBus } from './event-bus';

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_ACTIVE_RADIUS = 2;

type NPCTickFn = (npcIds: string[], lodLevel: LODLevel) => void;

const CHUNK_LOD_MAP: Record<number, LODLevel> = {
  0: 'full',
  1: 'reduced',
  2: 'minimal',
};

function chunkKey(coord: ChunkCoord): string {
  return `${coord.x},${coord.y}`;
}

export class ChunkSimulationEngine {
  private eventBus: CognitiveEventBus;
  private chunkSize: number;
  private activeRadius: number;

  private chunks: Map<string, SimulationChunk> = new Map();
  private npcChunkMap: Map<string, string> = new Map();
  private playerChunk: ChunkCoord = { x: 0, y: 0 };

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.chunkSize = DEFAULT_CHUNK_SIZE;
    this.activeRadius = DEFAULT_ACTIVE_RADIUS;
  }

  assignNPCToChunk(npc: NPCCore): SimulationChunk {
    const coord = this.worldToChunkCoord(npc.position);
    const key = chunkKey(coord);

    const existing = this.npcChunkMap.get(npc.id);
    if (existing !== undefined && existing !== key) {
      const oldChunk = this.chunks.get(existing);
      if (oldChunk !== undefined) {
        oldChunk.npcIds = oldChunk.npcIds.filter((id) => id !== npc.id);
      }
    }

    let chunk = this.chunks.get(key);
    if (chunk === undefined) {
      chunk = {
        coord,
        npcIds: [],
        lodLevel: 'dormant',
        lastTickMs: 0,
        tickIntervalMs: 0,
        isActive: false,
      };
      this.chunks.set(key, chunk);
    }

    if (!chunk.npcIds.includes(npc.id)) {
      chunk.npcIds.push(npc.id);
    }
    this.npcChunkMap.set(npc.id, key);

    this.updateChunkLOD(chunk);

    return chunk;
  }

  updatePlayerPosition(pos: Vec2): void {
    const newPlayerChunk = this.worldToChunkCoord(pos);
    const oldKey = chunkKey(this.playerChunk);
    const newKey = chunkKey(newPlayerChunk);

    this.playerChunk = newPlayerChunk;

    if (oldKey === newKey) return;

    for (const chunk of this.chunks.values()) {
      this.updateChunkLOD(chunk);
    }
  }

  processChunks(npcTickFn: NPCTickFn): void {
    const activeChunks = this.getActiveChunks();

    for (const chunk of activeChunks) {
      const tickStart = performance.now();
      npcTickFn(chunk.npcIds, chunk.lodLevel);
      chunk.lastTickMs = performance.now() - tickStart;

      this.eventBus.emit({
        type: 'CHUNK_TICK',
        source: 'chunk-simulation-engine',
        data: {
          coord: chunk.coord,
          lodLevel: chunk.lodLevel,
          npcCount: chunk.npcIds.length,
          tickMs: chunk.lastTickMs,
        },
      });
    }
  }

  getActiveChunks(): SimulationChunk[] {
    const result: SimulationChunk[] = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.isActive) {
        result.push(chunk);
      }
    }
    return result;
  }

  getAllChunks(): SimulationChunk[] {
    return [...this.chunks.values()];
  }

  getChunk(coord: ChunkCoord): SimulationChunk | undefined {
    return this.chunks.get(chunkKey(coord));
  }

  getStats(): ChunkStats {
    let activeChunks = 0;
    let dormantChunks = 0;
    let totalNPCs = 0;
    let activeNPCs = 0;

    for (const chunk of this.chunks.values()) {
      totalNPCs += chunk.npcIds.length;
      if (chunk.isActive) {
        activeChunks += 1;
        activeNPCs += chunk.npcIds.length;
      } else {
        dormantChunks += 1;
      }
    }

    return {
      totalChunks: this.chunks.size,
      activeChunks,
      dormantChunks,
      totalNPCs,
      activeNPCs,
      avgNPCsPerChunk: this.chunks.size > 0 ? totalNPCs / this.chunks.size : 0,
    };
  }

  private worldToChunkCoord(pos: Vec2): ChunkCoord {
    return {
      x: Math.floor(pos.x / this.chunkSize),
      y: Math.floor(pos.y / this.chunkSize),
    };
  }

  private updateChunkLOD(chunk: SimulationChunk): void {
    const dx = Math.abs(chunk.coord.x - this.playerChunk.x);
    const dy = Math.abs(chunk.coord.y - this.playerChunk.y);
    const chebyshevDist = Math.max(dx, dy);

    const wasActive = chunk.isActive;
    const oldLod = chunk.lodLevel;

    if (chebyshevDist <= this.activeRadius) {
      chunk.isActive = true;
      chunk.lodLevel = CHUNK_LOD_MAP[chebyshevDist] ?? 'dormant';
      const config = chunk.lodLevel === 'full'
        ? 5000
        : chunk.lodLevel === 'reduced'
          ? 10000
          : chunk.lodLevel === 'minimal'
            ? 30000
            : 0;
      chunk.tickIntervalMs = config;
    } else {
      chunk.isActive = false;
      chunk.lodLevel = 'dormant';
      chunk.tickIntervalMs = 0;
    }

    if (wasActive !== chunk.isActive) {
      if (chunk.isActive) {
        this.eventBus.emit({
          type: 'CHUNK_LOADED',
          source: 'chunk-simulation-engine',
          data: { coord: chunk.coord, lodLevel: chunk.lodLevel },
        });
      } else {
        this.eventBus.emit({
          type: 'CHUNK_UNLOADED',
          source: 'chunk-simulation-engine',
          data: { coord: chunk.coord },
        });
      }
    } else if (oldLod !== chunk.lodLevel && chunk.isActive) {
      this.eventBus.emit({
        type: 'CHUNK_LOADED',
        source: 'chunk-simulation-engine',
        data: { coord: chunk.coord, lodLevel: chunk.lodLevel, lodChanged: true },
      });
    }
  }
}

export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: DEFAULT_CHUNK_SIZE,
  activeRadius: DEFAULT_ACTIVE_RADIUS,
};
