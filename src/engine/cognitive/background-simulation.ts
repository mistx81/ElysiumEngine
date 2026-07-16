import type {
  BackgroundStats,
  NPCCore,
  CognitiveEvent,
} from '../types';
import type { CognitiveEventBus } from './event-bus';
import type { WorldKnowledge } from './world-knowledge';
import type { EconomyEngine } from './economy-engine';
import type { ScheduleEngine } from './schedule-engine';
import type { SocialSimulation } from './social-simulation';

const DEFAULT_INTERVAL_MS = 5000;

type PhaseName =
  | 'world-tick'
  | 'economy'
  | 'schedule'
  | 'social'
  | 'gossip'
  | 'memory'
  | 'reflection'
  | 'stats';

const PHASE_NAMES: PhaseName[] = [
  'world-tick',
  'economy',
  'schedule',
  'social',
  'gossip',
  'memory',
  'reflection',
  'stats',
];

export class BackgroundSimulation {
  private eventBus: CognitiveEventBus;
  private worldKnowledge: WorldKnowledge;
  private economyEngine: EconomyEngine;
  private scheduleEngine: ScheduleEngine;
  private socialSimulation: SocialSimulation;

  private running = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number = DEFAULT_INTERVAL_MS;

  private ticks = 0;
  private lastTickMs = 0;
  private totalTickMs = 0;
  private phaseTimings: Record<string, number> = {};

  constructor(
    eventBus: CognitiveEventBus,
    worldKnowledge: WorldKnowledge,
    economyEngine: EconomyEngine,
    scheduleEngine: ScheduleEngine,
    socialSimulation: SocialSimulation,
  ) {
    this.eventBus = eventBus;
    this.worldKnowledge = worldKnowledge;
    this.economyEngine = economyEngine;
    this.scheduleEngine = scheduleEngine;
    this.socialSimulation = socialSimulation;

    for (const phase of PHASE_NAMES) {
      this.phaseTimings[phase] = 0;
    }
  }

  tick(npcs: NPCCore[]): BackgroundStats {
    const tickStart = performance.now();
    this.phaseTimings = {};
    for (const phase of PHASE_NAMES) {
      this.phaseTimings[phase] = 0;
    }

    const currentMs = Date.now();

    this.runPhase('world-tick', () => {
      this.worldKnowledge.tick(currentMs);
    });

    this.runPhase('economy', () => {
      this.economyEngine.updatePrices();
    });

    this.runPhase('schedule', () => {
      const worldState = this.worldKnowledge.getWorldState();
      const hour = worldState.hour;
      for (const npc of npcs) {
        if (!npc.isAlive || !npc.schedule) continue;
        this.scheduleEngine.tick(npc.schedule, hour);
      }
    });

    this.runPhase('social', () => {
      for (const npc of npcs) {
        if (!npc.isAlive) continue;
        if (npc.lodLevel === 'dormant') continue;
      }
    });

    this.runPhase('gossip', () => {
      this.socialSimulation.updateGossip();
    });

    this.runPhase('memory', () => {
      for (const npc of npcs) {
        if (!npc.isAlive) continue;
        const now = currentMs;
        for (const memType of Object.keys(npc.memories) as Array<keyof typeof npc.memories>) {
          const memories = npc.memories[memType];
          for (const mem of memories) {
            if (mem.decayRate > 0) {
              mem.lastAccessed = now;
            }
          }
        }
      }
    });

    this.runPhase('reflection', () => {
      for (const npc of npcs) {
        if (!npc.isAlive) continue;
        if (npc.lodLevel === 'dormant' || npc.lodLevel === 'minimal') continue;
      }
    });

    this.runPhase('stats', () => {
      this.ticks += 1;
    });

    const tickEnd = performance.now();
    this.lastTickMs = tickEnd - tickStart;
    this.totalTickMs += this.lastTickMs;

    this.eventBus.emit({
      type: 'BACKGROUND_TICK',
      source: 'background-simulation',
      data: {
        ticks: this.ticks,
        lastTickMs: this.lastTickMs,
        phaseTimings: { ...this.phaseTimings },
      },
    });

    return this.getStats();
  }

  private runPhase(phase: PhaseName, fn: () => void): void {
    const start = performance.now();
    fn();
    const elapsed = performance.now() - start;
    this.phaseTimings[phase] = elapsed;

    this.eventBus.emit({
      type: 'BACKGROUND_PHASE_COMPLETED',
      source: 'background-simulation',
      data: {
        phase,
        durationMs: elapsed,
      },
    });
  }

  start(npcs: NPCCore[], intervalMs?: number): void {
    if (this.running) return;
    this.running = true;
    if (intervalMs !== undefined) {
      this.intervalMs = intervalMs;
    }
    this.timerId = setInterval(() => {
      this.tick(npcs);
    }, this.intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getStats(): BackgroundStats {
    return {
      ticks: this.ticks,
      lastTickMs: this.lastTickMs,
      avgTickMs: this.ticks > 0 ? this.totalTickMs / this.ticks : 0,
      phaseTimings: { ...this.phaseTimings },
    };
  }

  getPhaseTimings(): Record<string, number> {
    return { ...this.phaseTimings };
  }
}
