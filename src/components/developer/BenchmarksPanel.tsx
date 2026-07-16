import { useState, useRef, useEffect } from 'react';
import type { BenchmarkResult, BenchmarkSuite } from '../../engine/types';
import { runCognitiveBenchmarks, getStaticBenchmarkResults } from '../../sdk/benchmarks/cognitive-benchmarks';
import { runBenchmark, type BenchmarkRunnerOptions } from '../../sdk/benchmarks/benchmark-runner';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const styles: Record<string, any> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' },
  card: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '16px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: COLORS.textMuted,
    marginBottom: '12px',
  },
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600,
  },
  td: { padding: '8px 10px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.text },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: COLORS.bg,
    borderRadius: '3px',
    overflow: 'hidden',
    border: `1px solid ${COLORS.border}`,
    marginTop: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: '3px',
    transition: 'width 0.1s ease',
  },
  chartBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
  },
  chartLabel: { fontSize: '11px', color: COLORS.textMuted, minWidth: '160px', fontFamily: 'monospace' },
  chartTrack: { flex: 1, height: '14px', backgroundColor: COLORS.bg, borderRadius: '3px', overflow: 'hidden', border: `1px solid ${COLORS.border}` },
  chartFill: { height: '100%', borderRadius: '3px' },
  chartVal: { fontSize: '11px', color: COLORS.text, fontFamily: 'monospace', minWidth: '70px', textAlign: 'right' },
  statusText: { fontSize: '12px', color: COLORS.textMuted },
};

export default function BenchmarksPanel(props: any) {
  const [results, setResults] = useState<BenchmarkResult[]>(getStaticBenchmarkResults());
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [history, setHistory] = useState<BenchmarkSuite[]>([]);
  const cancelRef = useRef<boolean>(false);

  const maxOps = Math.max(...results.map((r) => r.opsPerSecond), 1);

  const runAll = async () => {
    setRunning(true);
    setProgress(0);
    cancelRef.current = false;
    try {
      const opts: BenchmarkRunnerOptions = {
        iterations: 500,
        onProgress: (cur, total, name) => {
          setProgress((cur / total) * 100);
          setProgressLabel(`${name} (${cur}/${total})`);
        },
      };
      const suite = await runCognitiveBenchmarks({ npcCount: 100, iterations: 500 }, opts);
      if (cancelRef.current) return;
      setResults(suite.results);
      setHistory((h) => [...h, suite].slice(-5));
    } catch (err: any) {
      setProgressLabel(`Error: ${err?.message ?? err}`);
    } finally {
      setRunning(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => { cancelRef.current = true; };
  }, []);

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toFixed(2);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Benchmark Runner</div>
        <div style={{ ...styles.btnRow, marginBottom: '8px' }}>
          <button style={styles.btn} onClick={runAll} disabled={running}>
            {running ? 'Running...' : '▶ Run Benchmarks'}
          </button>
          <button style={styles.btnGhost} onClick={() => setResults(getStaticBenchmarkResults())} disabled={running}>
            Reset to Static
          </button>
          <span style={styles.statusText}>
            {running ? `Running: ${progressLabel}` : `${results.length} benchmarks`}
          </span>
        </div>
        {running && (
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Results</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Benchmark</th>
              <th style={styles.th}>Iterations</th>
              <th style={styles.th}>Avg (ms)</th>
              <th style={styles.th}>Min (ms)</th>
              <th style={styles.th}>Max (ms)</th>
              <th style={styles.th}>Ops/sec</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.name}>
                <td style={styles.td}>{r.name}</td>
                <td style={styles.td}>{r.iterations.toLocaleString()}</td>
                <td style={styles.td}>{r.avgMs.toFixed(4)}</td>
                <td style={styles.td}>{r.minMs.toFixed(4)}</td>
                <td style={styles.td}>{r.maxMs.toFixed(4)}</td>
                <td style={{ ...styles.td, color: COLORS.success, fontWeight: 600 }}>{formatNum(r.opsPerSecond)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Ops/sec Comparison</div>
        {results.map((r) => {
          const pct = (r.opsPerSecond / maxOps) * 100;
          const color = pct > 66 ? COLORS.success : pct > 33 ? COLORS.warning : COLORS.error;
          return (
            <div key={r.name} style={styles.chartBar}>
              <span style={styles.chartLabel}>{r.name}</span>
              <div style={styles.chartTrack}>
                <div style={{ ...styles.chartFill, width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span style={styles.chartVal}>{formatNum(r.opsPerSecond)}</span>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Historical Runs ({history.length})</div>
          {history.map((suite, i) => (
            <div key={i} style={{ fontSize: '12px', color: COLORS.textMuted, padding: '4px 0' }}>
              Run {i + 1}: {suite.results.length} benchmarks · {suite.totalMs.toFixed(1)}ms total
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
