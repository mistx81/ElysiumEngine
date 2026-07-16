import type {
  CacheEntry,
  CacheStats,
  CacheConfig,
} from '../types';
import type { CognitiveEventBus } from './event-bus';

const DEFAULT_MAX_SIZE = 1000;
const DEFAULT_MAX_MEMORY_BYTES = 50 * 1024 * 1024;
const DEFAULT_TTL = 300000;

type InternalEntry = {
  key: string;
  value: any;
  category: string;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
  sizeBytes: number;
};

export class CacheSystem {
  private eventBus: CognitiveEventBus;
  private entries: Map<string, InternalEntry> = new Map();
  private maxSize: number;
  private maxMemoryBytes: number;
  private defaultTtl: number;

  private totalHits = 0;
  private totalMisses = 0;
  private totalEvictions = 0;
  private estimatedMemoryBytes = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.maxSize = DEFAULT_MAX_SIZE;
    this.maxMemoryBytes = DEFAULT_MAX_MEMORY_BYTES;
    this.defaultTtl = DEFAULT_TTL;
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      this.totalMisses += 1;
      this.eventBus.emit({
        type: 'CACHE_MISS',
        source: 'cache-system',
        data: { key },
      });
      return undefined;
    }

    const now = Date.now();
    if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
      this.entries.delete(key);
      this.estimatedMemoryBytes -= entry.sizeBytes;
      this.totalMisses += 1;
      this.eventBus.emit({
        type: 'CACHE_MISS',
        source: 'cache-system',
        data: { key, reason: 'expired' },
      });
      return undefined;
    }

    this.entries.delete(key);
    entry.lastAccessed = now;
    this.entries.set(key, entry);

    this.totalHits += 1;
    this.eventBus.emit({
      type: 'CACHE_HIT',
      source: 'cache-system',
      data: { key, category: entry.category, sizeBytes: entry.sizeBytes },
    });

    return entry.value as T;
  }

  set<T>(key: string, value: T, category?: string, ttl?: number): void {
    const existing = this.entries.get(key);
    if (existing !== undefined) {
      this.estimatedMemoryBytes -= existing.sizeBytes;
      this.entries.delete(key);
    }

    const sizeBytes = this.estimateSize(value);
    const entry: InternalEntry = {
      key,
      value,
      category: category ?? 'default',
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
      lastAccessed: Date.now(),
      sizeBytes,
    };

    this.entries.set(key, entry);
    this.estimatedMemoryBytes += sizeBytes;

    this.evict();
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (entry === undefined) return false;
    const now = Date.now();
    if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
      this.entries.delete(key);
      this.estimatedMemoryBytes -= entry.sizeBytes;
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.entries.get(key);
    if (entry === undefined) return false;
    this.entries.delete(key);
    this.estimatedMemoryBytes -= entry.sizeBytes;
    return true;
  }

  clear(category?: string): void {
    if (category === undefined) {
      this.entries.clear();
      this.estimatedMemoryBytes = 0;
      return;
    }

    for (const [key, entry] of this.entries) {
      if (entry.category === category) {
        this.estimatedMemoryBytes -= entry.sizeBytes;
        this.entries.delete(key);
      }
    }
  }

  evict(): void {
    while (
      this.entries.size > this.maxSize ||
      this.estimatedMemoryBytes > this.maxMemoryBytes
    ) {
      if (this.entries.size === 0) break;

      let oldestKey: string | null = null;
      let oldestAccess = Infinity;
      for (const [key, entry] of this.entries) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey === null) break;

      const entry = this.entries.get(oldestKey)!;
      this.entries.delete(oldestKey);
      this.estimatedMemoryBytes -= entry.sizeBytes;
      this.totalEvictions += 1;

      this.eventBus.emit({
        type: 'CACHE_EVICTED',
        source: 'cache-system',
        data: {
          key: oldestKey,
          category: entry.category,
          sizeBytes: entry.sizeBytes,
          reason: this.entries.size >= this.maxSize ? 'size' : 'memory',
        },
      });
    }
  }

  getStats(): CacheStats {
    const entriesByCategory: Record<string, number> = {};
    for (const entry of this.entries.values()) {
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] ?? 0) + 1;
    }

    const totalRequests = this.totalHits + this.totalMisses;

    return {
      totalEntries: this.entries.size,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalEvictions: this.totalEvictions,
      hitRate: totalRequests > 0 ? this.totalHits / totalRequests : 0,
      estimatedMemoryBytes: this.estimatedMemoryBytes,
      entriesByCategory,
    };
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

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: DEFAULT_MAX_SIZE,
  maxMemoryBytes: DEFAULT_MAX_MEMORY_BYTES,
  defaultTtl: DEFAULT_TTL,
};
