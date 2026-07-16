import type {
  BatchWriteEntry,
  BatchWriteStats,
  BatchWriteConfig,
} from '../types';
import type { CognitiveEventBus } from './event-bus';

const DEFAULT_MAX_BATCH_SIZE = 100;
const DEFAULT_MAX_MEMORY_BYTES = 1024 * 1024;
const DEFAULT_FLUSH_INTERVAL_MS = 5000;

type FlushCallback = (entries: BatchWriteEntry[]) => Promise<void>;

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `batch_${Date.now()}_${idCounter}`;
}

export class BatchWriteSystem {
  private eventBus: CognitiveEventBus;
  private maxBatchSize: number;
  private maxMemoryBytes: number;
  private flushIntervalMs: number;

  private queue: BatchWriteEntry[] = [];
  private currentMemoryBytes = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private flushCallback: FlushCallback | null = null;

  private totalWrites = 0;
  private totalFlushes = 0;
  private lastFlushMs = 0;
  private totalFlushSize = 0;
  private writesByTable: Record<string, number> = {};

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.maxBatchSize = DEFAULT_MAX_BATCH_SIZE;
    this.maxMemoryBytes = DEFAULT_MAX_MEMORY_BYTES;
    this.flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS;
  }

  enqueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    priority: number = 0,
  ): void {
    const sizeBytes = this.estimateSize(data);
    const entry: BatchWriteEntry = {
      id: generateId(),
      table,
      operation,
      data,
      priority,
      timestamp: Date.now(),
      sizeBytes,
    };

    this.queue.push(entry);
    this.currentMemoryBytes += sizeBytes;
    this.totalWrites += 1;
    this.writesByTable[table] = (this.writesByTable[table] ?? 0) + 1;

    if (
      this.queue.length >= this.maxBatchSize ||
      this.currentMemoryBytes >= this.maxMemoryBytes
    ) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const flushStart = performance.now();

    const sorted = [...this.queue].sort((a, b) => b.priority - a.priority);
    const entries = sorted;
    const flushSize = entries.length;

    if (this.flushCallback !== null) {
      try {
        await this.flushCallback(entries);
      } catch {
        // flush errors are isolated
      }
    }

    this.totalFlushes += 1;
    this.totalFlushSize += flushSize;
    this.lastFlushMs = performance.now() - flushStart;

    this.currentMemoryBytes = 0;
    this.queue = [];

    this.eventBus.emit({
      type: 'BATCH_WRITE_FLUSHED',
      source: 'batch-write-system',
      data: {
        flushSize,
        totalFlushes: this.totalFlushes,
        lastFlushMs: this.lastFlushMs,
        tables: entries.reduce<Record<string, number>>((acc, e) => {
          acc[e.table] = (acc[e.table] ?? 0) + 1;
          return acc;
        }, {}),
      },
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timerId = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.flush();
  }

  setFlushCallback(cb: FlushCallback): void {
    this.flushCallback = cb;
  }

  getStats(): BatchWriteStats {
    return {
      totalWrites: this.totalWrites,
      totalFlushes: this.totalFlushes,
      pendingWrites: this.queue.length,
      lastFlushMs: this.lastFlushMs,
      avgFlushSize: this.totalFlushes > 0 ? this.totalFlushSize / this.totalFlushes : 0,
      writesByTable: { ...this.writesByTable },
    };
  }

  getPending(): BatchWriteEntry[] {
    return [...this.queue];
  }

  private estimateSize(value: any): number {
    if (value === null || value === undefined) return 0;
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 0;
    }
  }
}

export const DEFAULT_BATCH_WRITE_CONFIG: BatchWriteConfig = {
  maxBatchSize: DEFAULT_MAX_BATCH_SIZE,
  maxMemoryBytes: DEFAULT_MAX_MEMORY_BYTES,
  flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
};
