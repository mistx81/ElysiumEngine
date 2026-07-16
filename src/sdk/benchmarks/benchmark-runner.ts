import type { BenchmarkResult, BenchmarkSuite } from '../../engine/types';

export type BenchmarkRunnerOptions = {
  iterations?: number;
  warmupIterations?: number;
  onProgress?: (current: number, total: number, name: string) => void;
};

export type BenchmarkFn = () => void | Promise<void>;

export async function runBenchmark(
  name: string,
  fn: BenchmarkFn,
  options: BenchmarkRunnerOptions = {},
): Promise<BenchmarkResult> {
  const iterations = options.iterations ?? 1000;
  const warmup = options.warmupIterations ?? Math.min(10, Math.floor(iterations * 0.1));

  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const times: number[] = [];
  const memBefore = typeof performance !== 'undefined' && (performance as any).memory
    ? (performance as any).memory.usedJSHeapSize
    : 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
    options.onProgress?.(i + 1, iterations, name);
  }

  const memAfter = typeof performance !== 'undefined' && (performance as any).memory
    ? (performance as any).memory.usedJSHeapSize
    : 0;

  const totalMs = times.reduce((a, b) => a + b, 0);
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const avgMs = totalMs / iterations;
  const opsPerSecond = iterations / (totalMs / 1000);

  return {
    name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    opsPerSecond,
    memoryUsedBytes: memAfter && memBefore ? memAfter - memBefore : undefined,
  };
}

export async function runSuite(
  suiteName: string,
  benchmarks: { name: string; fn: BenchmarkFn }[],
  options: BenchmarkRunnerOptions = {},
): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];
  let totalMs = 0;

  for (const bench of benchmarks) {
    const result = await runBenchmark(bench.name, bench.fn, options);
    results.push(result);
    totalMs += result.totalMs;
  }

  return { name: suiteName, results, totalMs };
}
