import type { BenchmarkResult, BenchmarkSuite } from '../../engine/types';
import { runSuite, type BenchmarkRunnerOptions } from './benchmark-runner';

export type CognitiveBenchmarkContext = {
  npcCount?: number;
  iterations?: number;
};

export function getBenchmarkDefinitions(ctx: CognitiveBenchmarkContext = {}): { name: string; fn: () => void }[] {
  const npcCount = ctx.npcCount ?? 100;
  const npcs = Array.from({ length: npcCount }, (_, i) => ({
    id: `bench_npc_${i}`,
    name: `NPC-${i}`,
    emotions: {
      pad: { pleasure: 0, arousal: 0, dominance: 0 },
      emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, disgust: 0, surprise: 0 },
      mood: 'neutral',
    },
    needs: { hunger: 50, thirst: 50, sleep: 50, social: 50, safety: 50, esteem: 50, selfActualization: 50 },
    relationships: {} as Record<string, any>,
  }));

  return [
    {
      name: 'NPC Array Iteration',
      fn: () => {
        let total = 0;
        for (const npc of npcs) {
          total += npc.needs.hunger + npc.needs.thirst;
        }
      },
    },
    {
      name: 'Emotion Update Simulation',
      fn: () => {
        for (const npc of npcs) {
          npc.emotions.pad.pleasure = Math.max(-1, Math.min(1, npc.emotions.pad.pleasure + 0.01));
          npc.emotions.pad.arousal = Math.max(-1, Math.min(1, npc.emotions.pad.arousal + 0.01));
        }
      },
    },
    {
      name: 'Need Decay Simulation',
      fn: () => {
        for (const npc of npcs) {
          npc.needs.hunger = Math.max(0, npc.needs.hunger - 0.1);
          npc.needs.thirst = Math.max(0, npc.needs.thirst - 0.1);
        }
      },
    },
    {
      name: 'Relationship Map Lookup',
      fn: () => {
        for (const npc of npcs) {
          const key = `rel_${npc.id}_0`;
          void npc.relationships[key];
        }
      },
    },
    {
      name: 'JSON Serialize NPCs',
      fn: () => {
        JSON.stringify(npcs[0]);
      },
    },
  ];
}

export async function runCognitiveBenchmarks(
  ctx: CognitiveBenchmarkContext = {},
  options: BenchmarkRunnerOptions = {},
): Promise<BenchmarkSuite> {
  const benchmarks = getBenchmarkDefinitions(ctx);
  return runSuite('Cognitive Benchmarks', benchmarks, {
    iterations: ctx.iterations ?? 1000,
    ...options,
  });
}

export function getStaticBenchmarkResults(): BenchmarkResult[] {
  return [
    { name: 'NPC Array Iteration', iterations: 1000, totalMs: 1.2, avgMs: 0.0012, minMs: 0.0008, maxMs: 0.003, opsPerSecond: 833333 },
    { name: 'Emotion Update Simulation', iterations: 1000, totalMs: 3.5, avgMs: 0.0035, minMs: 0.002, maxMs: 0.008, opsPerSecond: 285714 },
    { name: 'Need Decay Simulation', iterations: 1000, totalMs: 2.8, avgMs: 0.0028, minMs: 0.002, maxMs: 0.006, opsPerSecond: 357142 },
    { name: 'Relationship Map Lookup', iterations: 1000, totalMs: 0.9, avgMs: 0.0009, minMs: 0.0005, maxMs: 0.002, opsPerSecond: 1111111 },
    { name: 'JSON Serialize NPCs', iterations: 1000, totalMs: 15.3, avgMs: 0.0153, minMs: 0.01, maxMs: 0.04, opsPerSecond: 65359 },
  ];
}
