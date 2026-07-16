import { CognitiveBenchmarks } from './cognitive-benchmarks';

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         Elysium Engine — Cognitive Benchmarks           ║');
  console.log('║                    Phase 5 SDK                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const benchmarks = new CognitiveBenchmarks();
  const suites = benchmarks.runAll();

  for (const suite of suites) {
    console.log(benchmarks['runner'].formatSuite(suite));
  }

  // Summary
  const totalMs = suites.reduce((sum, s) => sum + s.totalMs, 0);
  const totalBenchmarks = suites.reduce((sum, s) => sum + s.results.length, 0);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  suites:      ${suites.length}`);
  console.log(`  benchmarks:  ${totalBenchmarks}`);
  console.log(`  total time:  ${totalMs.toFixed(2)} ms`);
  console.log('');

  const g = globalThis as any;
  if (g.process && typeof g.process.exit === 'function') {
    g.process.exit(0);
  }
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  const g = globalThis as any;
  if (g.process && typeof g.process.exit === 'function') {
    g.process.exit(1);
  }
});
