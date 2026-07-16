/**
 * ELYSIUM DEBUGGER — Complete testing & debugging environment
 * All inspectors, event triggers, sandbox, export/import, replay, performance, and logging.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useElysiumStore } from '../hooks/useElysiumStore';
import { NPCCore, CognitiveEvent, PersonalityProfile } from '../engine/types';

// ── Default personality ─────────────────────────────────────────────────────
const DEFAULT_PERSONALITY: PersonalityProfile = {
  openness: 60, conscientiousness: 50, extraversion: 55, agreeableness: 65,
  neuroticism: 40, courage: 50, aggression: 30, trust: 50, honesty: 60,
  loyalty: 55, mercy: 50, ambition: 45, caution: 50, patience: 55,
};

// ── Tab type ────────────────────────────────────────────────────────────────
type Tab = 'event-bus' | 'memory' | 'goap' | 'pad' | 'relationship' | 'goals'
  | 'needs' | 'decisions' | 'performance' | 'sandbox' | 'export-import' | 'replay' | 'logs'
  | 'economy' | 'schedule' | 'social' | 'world';

// ── Main Component ──────────────────────────────────────────────────────────
export function ElysiumDebugger() {
  const store = useElysiumStore();
  const [tab, setTab] = useState<Tab>('event-bus');
  const [npcName, setNpcName] = useState('Aldric');
  const [npcBackground, setNpcBackground] = useState('A former soldier turned merchant');
  const [npcDescription, setNpcDescription] = useState('Cautious but friendly');

  const handleCreate = () => {
    store.createNPC({
      name: npcName || 'Unnamed',
      background: npcBackground,
      personalityDescription: npcDescription,
      personality: { ...DEFAULT_PERSONALITY },
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Elysium Engine — Debug & Test Environment</h1>
        <div style={styles.headerControls}>
          <span style={styles.badge}>NPCs: {store.npcs.length}</span>
          <span style={styles.badge}>Ticks: {store.tickCount}</span>
          <span style={styles.badge}>Events: {store.eventLog.length}</span>
          <button
            style={store.isRunning ? styles.dangerBtn : styles.successBtn}
            onClick={store.isRunning ? store.stopSimulation : store.startSimulation}
          >
            {store.isRunning ? 'Stop Sim' : 'Start Sim'}
          </button>
          <button
            style={store.bgRunning ? styles.dangerBtn : styles.primaryBtn}
            onClick={store.bgRunning ? store.stopBackground : store.startBackground}
          >
            {store.bgRunning ? 'Stop World' : 'Start World'}
          </button>
          <button style={styles.smallBtn} onClick={store.manualBgTick} title="Run one background tick">
            World Tick
          </button>
        </div>
      </div>

      {/* NPC Management Bar */}
      <div style={styles.npcBar}>
        <input style={styles.input} placeholder="Name" value={npcName} onChange={e => setNpcName(e.target.value)} />
        <input style={styles.input} placeholder="Background" value={npcBackground} onChange={e => setNpcBackground(e.target.value)} />
        <input style={styles.input} placeholder="Description" value={npcDescription} onChange={e => setNpcDescription(e.target.value)} />
        <button style={styles.primaryBtn} onClick={handleCreate}>Create NPC</button>
        {store.npcs.map(npc => (
          <button
            key={npc.id}
            style={npc.id === store.selectedNpcId ? styles.selectedNpcBtn : styles.npcBtn}
            onClick={() => store.setSelectedNpcId(npc.id)}
          >
            {npc.name}
          </button>
        ))}
        {store.selectedNpc && (
          <button style={styles.dangerBtnSmall} onClick={() => store.deleteNPC(store.selectedNpcId!)}>
            Delete
          </button>
        )}
      </div>

      {/* Event Trigger Buttons */}
      <div style={styles.triggerBar}>
        <span style={styles.triggerLabel}>Trigger Event:</span>
        {(['betrayal', 'conversation', 'item_found', 'attack', 'reward', 'rumor'] as const).map(type => (
          <button
            key={type}
            style={styles.triggerBtn(type)}
            onClick={() => store.triggerEvent(type)}
            disabled={!store.selectedNpc}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {(['event-bus', 'memory', 'goap', 'pad', 'relationship', 'goals', 'needs', 'decisions', 'performance', 'sandbox', 'export-import', 'replay', 'logs', 'economy', 'schedule', 'social', 'world'] as Tab[]).map(t => (
          <button key={t} style={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {!store.selectedNpc && tab !== 'performance' && tab !== 'export-import' && tab !== 'replay' && tab !== 'logs' && tab !== 'sandbox' ? (
          <div style={styles.emptyState}>Select or create an NPC to inspect</div>
        ) : (
          <>
            {tab === 'event-bus' && <EventBusInspector store={store} />}
            {tab === 'memory' && <MemoryInspector npc={store.selectedNpc} runtime={store.runtime} />}
            {tab === 'goap' && <GoapVisualizer npc={store.selectedNpc} runtime={store.runtime} />}
            {tab === 'pad' && <PADGraph npc={store.selectedNpc} runtime={store.runtime} />}
            {tab === 'relationship' && <RelationshipViewer npc={store.selectedNpc} runtime={store.runtime} />}
            {tab === 'goals' && <GoalInspector npc={store.selectedNpc} />}
            {tab === 'needs' && <NeedsInspector npc={store.selectedNpc} />}
            {tab === 'decisions' && <DecisionViewer npc={store.selectedNpc} />}
            {tab === 'performance' && <PerformanceMonitor stats={store.perfStats} />}
            {tab === 'sandbox' && <Sandbox store={store} />}
            {tab === 'export-import' && <ExportImport store={store} />}
            {tab === 'replay' && <ReplayPanel store={store} />}
            {tab === 'logs' && <LogViewer logs={store.logs} onClear={store.clearEventLog} />}
            {tab === 'economy' && <EconomyInspector runtime={store.runtime} />}
            {tab === 'schedule' && <ScheduleInspector npc={store.selectedNpc} runtime={store.runtime} />}
            {tab === 'social' && <SocialInspector runtime={store.runtime} />}
            {tab === 'world' && <WorldInspector runtime={store.runtime} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── Event Bus Inspector ─────────────────────────────────────────────────────
function EventBusInspector({ store }: { store: ReturnType<typeof useElysiumStore> }) {
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = store.eventLog.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filter && !JSON.stringify(e).toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const eventTypes = ['all', ...new Set(store.eventLog.map(e => e.type))];

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Event Bus Inspector</h2>
        <span style={styles.statBadge}>{filtered.length} events</span>
        <select style={styles.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={styles.input} placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button style={styles.smallBtn} onClick={store.clearEventLog}>Clear</button>
      </div>
      <div style={styles.scrollContent}>
        {filtered.slice(-100).reverse().map(event => (
          <div key={event.seq} style={styles.eventRow(event.type)}>
            <span style={styles.eventSeq}>#{event.seq}</span>
            <span style={styles.eventType(event.type)}>{event.type}</span>
            <span style={styles.eventNpc}>{event.npcId ?? 'system'}</span>
            <span style={styles.eventData}>{JSON.stringify(event.data)}</span>
            <span style={styles.eventTime}>{new Date(event.timestamp).toLocaleTimeString()}.{event.timestamp % 1000}</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={styles.emptyState}>No events recorded</div>}
      </div>
    </div>
  );
}

// ── Memory Inspector ────────────────────────────────────────────────────────
function MemoryInspector({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  if (!npc) return null;
  const counts = runtime.memory.getCounts(npc.id);
  const allMemories = npc.memories;

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Memory Inspector — {npc.name}</h2>
      </div>
      <div style={styles.statsRow}>
        {Object.entries(counts).map(([type, count]) => (
          <div key={type} style={styles.statCard}>
            <div style={styles.statValue}>{String(count)}</div>
            <div style={styles.statLabel}>{type}</div>
          </div>
        ))}
      </div>
      <div style={styles.scrollContent}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Layer</th>
              <th style={styles.th}>Content</th>
              <th style={styles.th}>Importance</th>
              <th style={styles.th}>Strength</th>
              <th style={styles.th}>Valence</th>
              <th style={styles.th}>Forgotten</th>
              <th style={styles.th}>Tags</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {allMemories.slice().reverse().map(mem => (
              <tr key={mem.id} style={mem.isForgotten ? styles.forgottenRow : styles.tableRow}>
                <td style={styles.td}>{mem.layer}</td>
                <td style={styles.td}>{mem.content}</td>
                <td style={styles.td}>{(mem.importance * 100).toFixed(0)}%</td>
                <td style={styles.td}>{(mem.currentStrength * 100).toFixed(0)}%</td>
                <td style={styles.td}>{mem.emotionalValence.toFixed(2)}</td>
                <td style={styles.td}>{mem.isForgotten ? 'yes' : 'no'}</td>
                <td style={styles.td}>{mem.tags.join(', ')}</td>
                <td style={styles.td}>{new Date(mem.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allMemories.length === 0 && <div style={styles.emptyState}>No memories recorded</div>}
      </div>
    </div>
  );
}

// ── GOAP Plan Visualizer ────────────────────────────────────────────────────
function GoapVisualizer({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  if (!npc) return null;
  const plan = runtime.goap.getCachedPlan(npc.id);
  const actions = runtime.goap.getAvailableActions();

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>GOAP Plan Visualizer — {npc.name}</h2>
        <button style={styles.smallBtn} onClick={() => {
          const goal = npc.goals.find(g => g.status === 'in_progress');
          if (goal) runtime.goap.plan(npc, { state: { hasEnergy: true }, goalId: goal.id });
        }}>Re-plan</button>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Current Plan</h3>
          {plan ? (
            <div>
              <div style={styles.planInfo}>Goal: {plan.goalId}</div>
              <div style={styles.planInfo}>Total Cost: {plan.totalCost}</div>
              <div style={styles.planInfo}>Valid: {plan.isValid ? 'yes' : 'no'}</div>
              <div style={styles.planSteps}>
                {plan.actions.map((action: any, i: number) => (
                  <div key={i} style={styles.planStep}>
                    <span style={styles.stepNumber}>{i + 1}</span>
                    <span style={styles.stepName}>{action.name}</span>
                    <span style={styles.stepCost}>cost: {action.cost}</span>
                    <div style={styles.stepEffects}>
                      Pre: {JSON.stringify(action.preconditions)}
                      <br />
                      Effects: {JSON.stringify(action.effects)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>No cached plan. Trigger a goal or re-plan.</div>
          )}
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>Action Library ({actions.length})</h3>
          <div style={styles.scrollContent}>
            {actions.map((action: any) => (
              <div key={action.name} style={styles.actionCard}>
                <div style={styles.actionName}>{action.name} (cost: {action.cost})</div>
                <div style={styles.actionDetails}>
                  Pre: {JSON.stringify(action.preconditions)}
                  <br />
                  Effects: {JSON.stringify(action.effects)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAD Emotion Graph ───────────────────────────────────────────────────────
function PADGraph({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  if (!npc) return null;
  const padState = runtime.pad.getState(npc.id);
  const derived = runtime.pad.deriveEmotions(npc.id);
  const mood = runtime.pad.getMoodLabel(npc.id);

  const dims = padState
    ? [
        { label: 'Pleasure', value: padState.pleasure, color: '#2196f3' },
        { label: 'Arousal', value: padState.arousal, color: '#ff9800' },
        { label: 'Dominance', value: padState.dominance, color: '#4caf50' },
      ]
    : [];

  const derivedEmotions = [
    { label: 'Fear', value: derived.fear, color: '#f44336' },
    { label: 'Joy', value: derived.joy, color: '#4caf50' },
    { label: 'Anger', value: derived.anger, color: '#ff5722' },
    { label: 'Stress', value: derived.stress, color: '#ff9800' },
    { label: 'Trust', value: derived.trust, color: '#2196f3' },
    { label: 'Hope', value: derived.hope, color: '#9c27b0' },
  ];

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>PAD Emotion Graph — {npc.name}</h2>
        <span style={styles.moodBadge(mood)}>Mood: {mood}</span>
      </div>
      <div style={styles.padContainer}>
        <div style={styles.padSection}>
          <h3 style={styles.subTitle}>PAD Dimensions</h3>
          {dims.map(dim => (
            <div key={dim.label} style={styles.barRow}>
              <span style={styles.barLabel}>{dim.label}</span>
              <div style={styles.barContainer}>
                <div style={styles.barFill(dim.value, dim.color)} />
              </div>
              <span style={styles.barValue}>{dim.value.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <div style={styles.padSection}>
          <h3 style={styles.subTitle}>Derived Emotions</h3>
          {derivedEmotions.map(em => (
            <div key={em.label} style={styles.barRow}>
              <span style={styles.barLabel}>{em.label}</span>
              <div style={styles.barContainer}>
                <div style={styles.barFillPositive(em.value, em.color)} />
              </div>
              <span style={styles.barValue}>{em.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
      {/* PAD Space Visualization */}
      <div style={styles.padSpace}>
        <svg width="300" height="300" viewBox="-110 -110 220 220">
          <circle cx="0" cy="0" r="100" fill="#1a1a2e" stroke="#333" strokeWidth="1" />
          <line x1="-100" y1="0" x2="100" y2="0" stroke="#333" strokeWidth="1" />
          <line x1="0" y1="-100" x2="0" y2="100" stroke="#333" strokeWidth="1" />
          <text x="105" y="4" fill="#666" fontSize="10">P</text>
          <text x="2" y="-105" fill="#666" fontSize="10">A</text>
          {padState && (
            <circle
              cx={padState.pleasure * 100}
              cy={-padState.arousal * 100}
              r="6"
              fill="#e94560"
              opacity="0.8"
            >
              <title>P: {padState.pleasure.toFixed(2)}, A: {padState.arousal.toFixed(2)}, D: {padState.dominance.toFixed(2)}</title>
            </circle>
          )}
        </svg>
        <div style={styles.padLegend}>
          <div style={styles.legendItem}>
            <span style={styles.legendDot('#e94560')}></span>
            Current state (Pleasure vs Arousal)
          </div>
          <div>Dominance: {padState?.dominance.toFixed(3) ?? 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}

// ── Relationship Graph Viewer ───────────────────────────────────────────────
function RelationshipViewer({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  if (!npc) return null;
  const graph = runtime.relationshipGraph.getGraph(npc.id);
  const stats = runtime.relationshipGraph.getStats(npc.id);
  const nodes = graph ? Array.from(graph.nodes.values()) : [];
  const edges = graph ? Array.from(graph.edges.values()) : [];

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Relationship Graph — {npc.name}</h2>
        <span style={styles.statBadge}>{stats.nodes} nodes, {stats.edges} edges</span>
        <span style={styles.statBadge}>Avg Trust: {stats.avgTrust}</span>
        <span style={styles.statBadge}>Avg Affinity: {stats.avgAffinity}</span>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Graph Visualization</h3>
          <svg width="400" height="400" viewBox="0 0 400 400">
            {nodes.map((node: any, i: number) => {
              const angle = (i / nodes.length) * 2 * Math.PI;
              const x = 200 + Math.cos(angle) * 150;
              const y = 200 + Math.sin(angle) * 150;
              return (
                <g key={node.id}>
                  <circle cx={x} cy={y} r="20" fill={node.id === npc.id ? '#e94560' : node.type === 'player' ? '#2196f3' : '#4caf50'} />
                  <text x={x} y={y + 35} fill="#ccc" fontSize="10" textAnchor="middle">{node.label.slice(0, 10)}</text>
                </g>
              );
            })}
            {edges.map((edge: any, i: number) => {
              const fromNode = nodes.findIndex((n: any) => n.id === edge.from);
              const toNode = nodes.findIndex((n: any) => n.id === edge.to);
              if (fromNode === -1 || toNode === -1) return null;
              const fromAngle = (fromNode / nodes.length) * 2 * Math.PI;
              const toAngle = (toNode / nodes.length) * 2 * Math.PI;
              const x1 = 200 + Math.cos(fromAngle) * 150;
              const y1 = 200 + Math.sin(fromAngle) * 150;
              const x2 = 200 + Math.cos(toAngle) * 150;
              const y2 = 200 + Math.sin(toAngle) * 150;
              const color = edge.trust > 0 ? '#4caf50' : edge.trust < 0 ? '#f44336' : '#666';
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={Math.abs(edge.trust) / 20 + 1} opacity="0.6" />;
            })}
          </svg>
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>Edges</h3>
          <div style={styles.scrollContent}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Trust</th>
                  <th style={styles.th}>Fear</th>
                  <th style={styles.th}>Love</th>
                  <th style={styles.th}>Affinity</th>
                </tr>
              </thead>
              <tbody>
                {edges.map((edge: any, i: number) => (
                  <tr key={i} style={styles.tableRow}>
                    <td style={styles.td}>{edge.to}</td>
                    <td style={styles.td}>{edge.relationshipType}</td>
                    <td style={{ ...styles.td, color: edge.trust > 0 ? '#4caf50' : '#f44336' }}>{edge.trust.toFixed(0)}</td>
                    <td style={styles.td}>{edge.fear.toFixed(0)}</td>
                    <td style={styles.td}>{edge.love.toFixed(0)}</td>
                    <td style={styles.td}>{edge.affinity.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goal Inspector ──────────────────────────────────────────────────────────
function GoalInspector({ npc }: { npc: NPCCore | null }) {
  if (!npc) return null;
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Goal Inspector — {npc.name}</h2>
        <span style={styles.statBadge}>{npc.goals.length} goals</span>
      </div>
      <div style={styles.scrollContent}>
        {npc.goals.map(goal => (
          <div key={goal.id} style={styles.goalCard(goal.status)}>
            <div style={styles.goalHeader}>
              <span style={styles.goalTitle}>{goal.title}</span>
              <span style={styles.goalStatus(goal.status)}>{goal.status}</span>
            </div>
            <div style={styles.goalMeta}>
              Type: {goal.type} | Priority: {goal.priority} | Progress: {(goal.progress * 100).toFixed(0)}%
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${goal.progress * 100}%` }} />
            </div>
            <div style={styles.goalDesc}>{goal.description}</div>
          </div>
        ))}
        {npc.goals.length === 0 && <div style={styles.emptyState}>No goals</div>}
      </div>
    </div>
  );
}

// ── Needs Inspector ─────────────────────────────────────────────────────────
function NeedsInspector({ npc }: { npc: NPCCore | null }) {
  if (!npc) return null;
  const sorted = [...npc.needs].sort((a, b) => b.value - a.value);
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Needs Inspector — {npc.name}</h2>
      </div>
      <div style={styles.scrollContent}>
        {sorted.map(need => (
          <div key={need.type} style={styles.needRow}>
            <span style={styles.needLabel}>{need.type}</span>
            <div style={styles.needBarContainer}>
              <div style={{
                ...styles.needBarFill,
                width: `${need.value}%`,
                background: need.value > 70 ? '#f44336' : need.value > 40 ? '#ff9800' : '#4caf50',
              }} />
            </div>
            <span style={styles.needValue}>{need.value.toFixed(0)}</span>
            <span style={styles.needUrgency(need.value)}>
              {need.value > 70 ? 'CRITICAL' : need.value > 40 ? 'moderate' : 'low'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decision History Viewer ─────────────────────────────────────────────────
function DecisionViewer({ npc }: { npc: NPCCore | null }) {
  if (!npc) return null;
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Decision History — {npc.name}</h2>
        <span style={styles.statBadge}>{npc.decisions.length} decisions</span>
      </div>
      <div style={styles.scrollContent}>
        {npc.decisions.slice().reverse().map(d => (
          <div key={d.id} style={styles.decisionCard(d.success)}>
            <div style={styles.decisionHeader}>
              <span style={styles.decisionAction}>{d.action}</span>
              <span style={styles.decisionSuccess(d.success)}>{d.success ? 'SUCCESS' : 'FAIL'}</span>
            </div>
            <div style={styles.decisionReasoning}>{d.reasoning}</div>
            <div style={styles.decisionMeta}>
              Confidence: {(d.confidence * 100).toFixed(0)}% | {new Date(d.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {npc.decisions.length === 0 && <div style={styles.emptyState}>No decisions recorded</div>}
      </div>
    </div>
  );
}

// ── Performance Monitor ────────────────────────────────────────────────────
function PerformanceMonitor({ stats }: { stats: any }) {
  if (!stats) return <div style={styles.emptyState}>No performance data yet</div>;
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Performance Monitor</h2>
      </div>
      <div style={styles.statsGrid}>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.tickCount}</div><div style={styles.perfLabel}>Total Ticks</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.tickDurationMs}ms</div><div style={styles.perfLabel}>Last Tick</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.avgTickMs}ms</div><div style={styles.perfLabel}>Avg Tick</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.maxTickMs}ms</div><div style={styles.perfLabel}>Max Tick</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.registeredNpcs}</div><div style={styles.perfLabel}>NPCs</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{(stats.memoryUsageBytes / 1024).toFixed(0)}KB</div><div style={styles.perfLabel}>Memory</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.cacheHits}</div><div style={styles.perfLabel}>Cache Hits</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.cacheMisses}</div><div style={styles.perfLabel}>Cache Misses</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.eventsEmitted}</div><div style={styles.perfLabel}>Events Emitted</div></div>
        <div style={styles.perfCard}><div style={styles.perfValue}>{stats.eventsPerSecond}</div><div style={styles.perfLabel}>Events/sec</div></div>
      </div>
    </div>
  );
}

// ── Autonomous Simulation Sandbox ───────────────────────────────────────────
function Sandbox({ store }: { store: ReturnType<typeof useElysiumStore> }) {
  const [sandboxLog, setSandboxLog] = useState<string[]>([]);
  const [sandboxTicks, setSandboxTicks] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const log = useCallback((msg: string) => {
    setSandboxLog(prev => [...prev.slice(-200), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const runSandboxTick = useCallback(() => {
    const npc = store.selectedNpc;
    if (!npc) { log('No NPC selected'); return; }
    store.runtime.tick(npc);
    setSandboxTicks(prev => prev + 1);
    store.refreshNpcs();

    const padState = store.runtime.pad.getState(npc.id);
    const mood = store.runtime.pad.getMoodLabel(npc.id);
    const dominantNeed = [...npc.needs].sort((a, b) => b.value - a.value)[0];
    log(`Tick ${sandboxTicks + 1}: ${npc.name} | mood=${mood} | P=${padState?.pleasure.toFixed(2)} A=${padState?.arousal.toFixed(2)} D=${padState?.dominance.toFixed(2)} | need=${dominantNeed?.type}(${dominantNeed?.value.toFixed(0)})`);
  }, [store, sandboxTicks, log]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(runSandboxTick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, runSandboxTick]);

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Autonomous Simulation Sandbox</h2>
        <span style={styles.statBadge}>{sandboxTicks} ticks</span>
        <button style={running ? styles.dangerBtn : styles.successBtn} onClick={() => setRunning(!running)}>
          {running ? 'Stop' : 'Start'} Sandbox
        </button>
        <button style={styles.smallBtn} onClick={runSandboxTick} disabled={!store.selectedNpc}>Single Tick</button>
        <button style={styles.smallBtn} onClick={() => { setSandboxLog([]); setSandboxTicks(0); }}>Clear</button>
      </div>
      <div style={styles.sandboxInfo}>
        {store.selectedNpc ? (
          <span>Running: {store.selectedNpc.name} | The NPC runs autonomously without UI interaction.</span>
        ) : (
          <span>Select an NPC to run the sandbox</span>
        )}
      </div>
      <div style={styles.scrollContent}>
        {sandboxLog.map((line, i) => (
          <div key={i} style={styles.logLine}>{line}</div>
        ))}
        {sandboxLog.length === 0 && <div style={styles.emptyState}>No sandbox activity yet</div>}
      </div>
    </div>
  );
}

// ── Export/Import ───────────────────────────────────────────────────────────
function ExportImport({ store }: { store: ReturnType<typeof useElysiumStore> }) {
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('');

  const handleExport = (npcId: string) => {
    const json = store.exportNPC(npcId);
    setExportText(json);
    setStatus(`Exported ${npcId}`);
  };

  const handleImport = () => {
    const success = store.importNPC(importText);
    setStatus(success ? 'Import successful' : 'Import failed');
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Export / Import NPC State</h2>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Export</h3>
          <div style={styles.buttonRow}>
            {store.npcs.map(npc => (
              <button key={npc.id} style={styles.smallBtn} onClick={() => handleExport(npc.id)}>
                Export {npc.name}
              </button>
            ))}
          </div>
          <textarea
            style={styles.textArea}
            value={exportText}
            readOnly
            placeholder="Exported JSON will appear here..."
          />
          <button style={styles.primaryBtn} onClick={() => navigator.clipboard.writeText(exportText)}>Copy to Clipboard</button>
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>Import</h3>
          <textarea
            style={styles.textArea}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste NPC JSON here..."
          />
          <button style={styles.primaryBtn} onClick={handleImport}>Import NPC</button>
          {status && <div style={styles.statusMsg}>{status}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Deterministic Replay ────────────────────────────────────────────────────
function ReplayPanel({ store }: { store: ReturnType<typeof useElysiumStore> }) {
  const [replayText, setReplayText] = useState('');
  const [replayStatus, setReplayStatus] = useState('');
  const [stepMode, setStepMode] = useState(false);
  const [events, setEvents] = useState<CognitiveEvent[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleExportEvents = () => {
    const json = store.exportEventLog();
    setReplayText(json);
    setReplayStatus(`Exported ${store.eventLog.length} events`);
  };

  const handleLoadEvents = () => {
    try {
      const parsed = JSON.parse(replayText) as CognitiveEvent[];
      setEvents(parsed);
      setCurrentStep(0);
      setReplayStatus(`Loaded ${parsed.length} events`);
    } catch {
      setReplayStatus('Failed to parse events JSON');
    }
  };

  const handleReplayAll = () => {
    try {
      const parsed = JSON.parse(replayText) as CognitiveEvent[];
      store.replayEvents(parsed);
      setReplayStatus(`Replayed ${parsed.length} events`);
    } catch {
      setReplayStatus('Failed to replay');
    }
  };

  const handleStepForward = () => {
    if (currentStep >= events.length) return;
    const event = events[currentStep];
    store.runtime.bus.emit(event.type, event.data, event.npcId, event.targetId);
    store.refreshNpcs();
    setCurrentStep(prev => prev + 1);
    setReplayStatus(`Step ${currentStep + 1}/${events.length}: ${event.type}`);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Deterministic Replay</h2>
        <button style={styles.smallBtn} onClick={handleExportEvents}>Export Events</button>
        <button style={styles.smallBtn} onClick={handleLoadEvents}>Load Events</button>
        <button style={styles.primaryBtn} onClick={handleReplayAll}>Replay All</button>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked={stepMode} onChange={e => setStepMode(e.target.checked)} />
          Step Mode
        </label>
        {stepMode && (
          <button style={styles.smallBtn} onClick={handleStepForward} disabled={currentStep >= events.length}>
            Step Forward ({currentStep}/{events.length})
          </button>
        )}
      </div>
      <textarea
        style={styles.textArea}
        value={replayText}
        onChange={e => setReplayText(e.target.value)}
        placeholder="Event log JSON will appear here..."
      />
      {replayStatus && <div style={styles.statusMsg}>{replayStatus}</div>}
    </div>
  );
}

// ── Log Viewer ───────────────────────────────────────────────────────────────
function LogViewer({ logs, onClear }: { logs: Array<{ level: string; message: string; timestamp: Date }>; onClear: () => void }) {
  const [filter, setFilter] = useState('');
  const filtered = logs.filter(l => !filter || l.message.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Extensive Logs</h2>
        <span style={styles.statBadge}>{filtered.length} entries</span>
        <input style={styles.input} placeholder="Filter logs..." value={filter} onChange={e => setFilter(e.target.value)} />
        <button style={styles.smallBtn} onClick={onClear}>Clear Logs</button>
      </div>
      <div style={styles.scrollContent}>
        {filtered.slice().reverse().map((log, i) => (
          <div key={i} style={styles.logLineRow(log.level)}>
            <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}.{log.timestamp.getMilliseconds()}</span>
            <span style={styles.logLevel(log.level)}>{log.level.toUpperCase()}</span>
            <span style={styles.logMessage}>{log.message}</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={styles.emptyState}>No logs</div>}
      </div>
    </div>
  );
}

// ── Economy Inspector ───────────────────────────────────────────────────────
function EconomyInspector({ runtime }: { runtime: any }) {
  const items = runtime.economy.getAllItems();
  const stats = runtime.economy.getMarketStats();
  const transactions = runtime.economy.getRecentTransactions(20);
  const wallets = runtime.getRegisteredNPCs().map((npc: any) => ({
    npc: npc.name, wallet: runtime.economy.getWallet(npc.id),
  }));

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Economy Engine</h2>
        <span style={styles.statBadge}>Items: {stats.totalItems}</span>
        <span style={styles.statBadge}>Trades: {stats.totalTransactions}</span>
        <span style={styles.statBadge}>Avg Price: {stats.avgPrice}</span>
        <span style={styles.statBadge}>Gold: {stats.totalGoldInCirculation}</span>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Market Items</h3>
          <div style={styles.scrollContent}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Base</th>
                  <th style={styles.th}>Current</th>
                  <th style={styles.th}>Supply</th>
                  <th style={styles.th}>Demand</th>
                  <th style={styles.th}>Change</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const change = ((item.currentPrice - item.basePrice) / item.basePrice * 100);
                  return (
                    <tr key={item.id} style={styles.tableRow}>
                      <td style={styles.td}>{item.name}</td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.td}>{item.basePrice}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: change > 0 ? '#4caf50' : change < 0 ? '#f44336' : '#888' }}>{item.currentPrice}</td>
                      <td style={styles.td}>{item.supply.toFixed(0)}</td>
                      <td style={styles.td}>{item.demand.toFixed(0)}</td>
                      <td style={{ ...styles.td, color: change > 0 ? '#4caf50' : change < 0 ? '#f44336' : '#888' }}>{change > 0 ? '+' : ''}{change.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>NPC Wallets</h3>
          <div style={styles.scrollContent}>
            {wallets.map(({ npc, wallet }: any) => (
              <div key={npc} style={styles.actionCard}>
                <div style={styles.actionName}>{npc}: {wallet?.gold ?? 0} gold</div>
                <div style={styles.actionDetails}>
                  Trades: {wallet?.totalTrades ?? 0} | Spent: {wallet?.totalSpent ?? 0} | Earned: {wallet?.totalEarned ?? 0}
                  {wallet?.inventory && Object.keys(wallet.inventory).length > 0 && (
                    <div>Inventory: {Object.entries(wallet.inventory).map(([k, v]: any) => `${k}(${v})`).join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <h3 style={{ ...styles.subTitle, marginTop: '12px' }}>Recent Trades</h3>
          <div style={styles.scrollContent}>
            {transactions.slice().reverse().map((t: any) => (
              <div key={t.id} style={styles.actionCard}>
                <div style={styles.actionName}>{t.itemName} x{t.quantity} = {t.totalPrice}g</div>
                <div style={styles.actionDetails}>
                  Buyer: {t.buyerId.slice(0, 8)} → Seller: {t.sellerId.slice(0, 8)} | {new Date(t.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div style={styles.emptyState}>No trades yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Inspector ──────────────────────────────────────────────────────
function ScheduleInspector({ npc, runtime }: { npc: NPCCore | null; runtime: any }) {
  if (!npc) return <div style={styles.emptyState}>Select an NPC</div>;
  const schedule = runtime.schedule.getSchedule(npc.id);
  if (!schedule) return <div style={styles.emptyState}>No schedule</div>;
  const currentHour = runtime.schedule.getCurrentHour();
  const timeOfDay = runtime.schedule.getTimeOfDay();

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Schedule Engine — {npc.name}</h2>
        <span style={styles.statBadge}>Hour: {currentHour}:00</span>
        <span style={styles.statBadge}>Time: {timeOfDay}</span>
        <span style={styles.statBadge}>Day: {schedule.dayOffset}</span>
        <span style={styles.statBadge}>Adherence: {(schedule.adherenceScore * 100).toFixed(0)}%</span>
      </div>
      <div style={styles.scrollContent}>
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: '#e94560' }}>Current Activity: </strong>
          <span style={{ color: schedule.currentActivity ? '#4caf50' : '#888', fontWeight: 'bold' }}>
            {schedule.currentActivity ?? 'free time'}
          </span>
          {schedule.currentSlot && (
            <span style={{ color: '#888', marginLeft: '8px' }}>at {schedule.currentSlot.location}</span>
          )}
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Start</th>
              <th style={styles.th}>End</th>
              <th style={styles.th}>Activity</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Flexible</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.slots.map((slot: any, i: number) => {
              const isActive = currentHour >= slot.startHour && currentHour < slot.endHour;
              return (
                <tr key={i} style={{ ...styles.tableRow, background: isActive ? 'rgba(233,69,96,0.15)' : 'transparent' }}>
                  <td style={styles.td}>{slot.startHour}:00</td>
                  <td style={styles.td}>{slot.endHour}:00</td>
                  <td style={{ ...styles.td, fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#e94560' : '#ccc' }}>{slot.activity}</td>
                  <td style={styles.td}>{slot.location}</td>
                  <td style={styles.td}>{slot.priority}</td>
                  <td style={styles.td}>{slot.isFlexible ? 'yes' : 'no'}</td>
                  <td style={styles.td}>{isActive ? 'ACTIVE NOW' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Social Inspector ─────────────────────────────────────────────────────────
function SocialInspector({ runtime }: { runtime: any }) {
  const interactions = runtime.social.getInteractions(30);
  const stats = runtime.social.getStats();
  const gossip = runtime.social.getActiveGossip();
  const npcs = runtime.getRegisteredNPCs();
  const allReps = npcs.map((npc: any) => ({
    npc: npc.name, reps: runtime.social.getReputations(npc.id),
  }));

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Social Simulation</h2>
        <span style={styles.statBadge}>Interactions: {stats.totalInteractions}</span>
        <span style={styles.statBadge}>Active Gossip: {stats.activeGossip}</span>
        <span style={styles.statBadge}>Avg Trust: {stats.avgTrust}</span>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Recent Interactions</h3>
          <div style={styles.scrollContent}>
            {interactions.slice().reverse().map((i: any) => (
              <div key={i.id} style={styles.actionCard}>
                <div style={styles.actionName}>
                  <span style={{ color: i.outcome === 'positive' ? '#4caf50' : i.outcome === 'negative' ? '#f44336' : '#888' }}>
                    {i.type}
                  </span>
                  {' '}({i.outcome}) trust: {i.trustDelta > 0 ? '+' : ''}{i.trustDelta}
                </div>
                <div style={styles.actionDetails}>{i.description}</div>
                <div style={{ ...styles.actionDetails, color: '#555' }}>{new Date(i.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            {interactions.length === 0 && <div style={styles.emptyState}>No interactions yet. Start the world simulation.</div>}
          </div>
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>Reputations</h3>
          <div style={styles.scrollContent}>
            {allReps.map(({ npc, reps }: any) => (
              <div key={npc} style={{ marginBottom: '8px' }}>
                <div style={{ color: '#e94560', fontSize: '12px', fontWeight: 'bold' }}>{npc}</div>
                {reps?.map((r: any) => (
                  <div key={r.factionId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                    <span style={{ color: '#888' }}>{r.factionName}</span>
                    <span style={{ color: r.score > 0 ? '#4caf50' : r.score < 0 ? '#f44336' : '#888' }}>{r.score} ({r.trend})</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <h3 style={{ ...styles.subTitle, marginTop: '12px' }}>Active Gossip</h3>
          <div style={styles.scrollContent}>
            {gossip.map((g: any) => (
              <div key={g.id} style={styles.actionCard}>
                <div style={styles.actionDetails}>"{g.content}"</div>
                <div style={{ ...styles.actionDetails, color: '#555' }}>
                  Spread: {g.spreadCount.toFixed(1)} | Valence: {g.emotionalValence.toFixed(2)}
                </div>
              </div>
            ))}
            {gossip.length === 0 && <div style={styles.emptyState}>No active gossip</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── World Inspector ─────────────────────────────────────────────────────────
function WorldInspector({ runtime }: { runtime: any }) {
  const world = runtime.world.getWorldState();
  const locations = runtime.world.getLocations();
  const events = runtime.world.getActiveWorldEvents();
  const npcs = runtime.getRegisteredNPCs();
  const bgStats = runtime.getBackgroundStats();

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>World Knowledge</h2>
        <span style={styles.statBadge}>Day: {world.day}</span>
        <span style={styles.statBadge}>Weather: {world.weather}</span>
        <span style={styles.statBadge}>Season: {world.season}</span>
        <span style={styles.statBadge}>Danger: {world.globalDanger}</span>
        <span style={styles.statBadge}>Prosperity: {world.globalProsperity}</span>
        <span style={styles.statBadge}>BG Ticks: {bgStats.totalTicks}</span>
        <span style={styles.statBadge}>BG Interactions: {bgStats.interactionsGenerated}</span>
      </div>
      <div style={styles.splitView}>
        <div style={styles.leftPanel}>
          <h3 style={styles.subTitle}>Locations ({locations.length})</h3>
          <div style={styles.scrollContent}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Danger</th>
                  <th style={styles.th}>Prosperity</th>
                  <th style={styles.th}>Pop.</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc: any) => (
                  <tr key={loc.id} style={styles.tableRow}>
                    <td style={styles.td}>{loc.name}</td>
                    <td style={styles.td}>{loc.type}</td>
                    <td style={{ ...styles.td, color: loc.danger > 50 ? '#f44336' : loc.danger > 25 ? '#ff9800' : '#4caf50' }}>{loc.danger}</td>
                    <td style={{ ...styles.td, color: loc.prosperity > 60 ? '#4caf50' : loc.prosperity > 30 ? '#ff9800' : '#f44336' }}>{loc.prosperity}</td>
                    <td style={styles.td}>{loc.population}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ ...styles.subTitle, marginTop: '12px' }}>Active World Events</h3>
          <div style={styles.scrollContent}>
            {events.map((e: any) => (
              <div key={e.id} style={styles.actionCard}>
                <div style={styles.actionName}>{e.type}</div>
                <div style={styles.actionDetails}>{e.description}</div>
                <div style={{ ...styles.actionDetails, color: '#555' }}>
                  Severity: {(e.severity * 100).toFixed(0)}% | Duration: {e.duration}d | Locations: {e.affectedLocations.join(', ')}
                </div>
              </div>
            ))}
            {events.length === 0 && <div style={styles.emptyState}>No active world events</div>}
          </div>
        </div>
        <div style={styles.rightPanel}>
          <h3 style={styles.subTitle}>NPC Knowledge</h3>
          <div style={styles.scrollContent}>
            {npcs.map((npc: any) => {
              const facts = runtime.world.getNPCFacts(npc.id);
              return (
                <div key={npc.id} style={{ marginBottom: '8px' }}>
                  <div style={{ color: '#e94560', fontSize: '12px', fontWeight: 'bold' }}>
                    {npc.name} ({facts.length} facts)
                  </div>
                  {facts.slice(-5).map((f: any) => (
                    <div key={f.id} style={{ fontSize: '11px', padding: '2px 0', color: '#aaa' }}>
                      <span style={{ color: f.category === 'danger' ? '#f44336' : f.category === 'opportunity' ? '#4caf50' : '#888' }}>[{f.category}]</span>
                      {' '}{f.content}
                      <span style={{ color: '#555', marginLeft: '4px' }}>({(f.confidence * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {npcs.length === 0 && <div style={styles.emptyState}>No NPCs registered</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, any> = {
  container: { fontFamily: 'monospace', background: '#0f0f1e', color: '#e0e0e0', minHeight: '100vh', padding: '12px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' as const },
  title: { fontSize: '20px', margin: 0, color: '#e94560' },
  headerControls: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const },
  badge: { background: '#1a1a2e', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #333' },
  npcBar: { display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' as const, alignItems: 'center' },
  input: { background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', padding: '6px 10px', color: '#e0e0e0', fontSize: '13px', minWidth: '120px' },
  select: { background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', padding: '6px', color: '#e0e0e0', fontSize: '13px' },
  primaryBtn: { background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  successBtn: { background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  dangerBtn: { background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  dangerBtnSmall: { background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
  smallBtn: { background: '#333', color: '#ccc', border: '1px solid #444', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
  npcBtn: { background: '#1a1a2e', color: '#aaa', border: '1px solid #333', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' },
  selectedNpcBtn: { background: '#e94560', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' },
  triggerBar: { display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' as const },
  triggerLabel: { fontSize: '12px', color: '#888' },
  tabBar: { display: 'flex', gap: '2px', marginBottom: '8px', flexWrap: 'wrap' as const },
  tab: { background: '#1a1a2e', color: '#888', border: '1px solid #333', borderRadius: '4px 4px 0 0', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },
  tabActive: { background: '#16213e', color: '#e94560', border: '1px solid #e94560', borderRadius: '4px 4px 0 0', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' as const },
  content: { background: '#16213e', borderRadius: '0 4px 4px 4px', border: '1px solid #333', minHeight: '500px', padding: '12px' },
  panel: { height: '100%' },
  panelHeader: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' as const },
  panelTitle: { fontSize: '16px', margin: 0, color: '#e94560' },
  statBadge: { background: '#1a1a2e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #333' },
  scrollContent: { maxHeight: '600px', overflowY: 'auto' as const },
  emptyState: { padding: '40px', textAlign: 'center' as const, color: '#555' },
  eventRow: (type: string) => ({
    display: 'grid', gridTemplateColumns: '50px 150px 120px 1fr 100px', gap: '8px',
    padding: '4px 8px', borderBottom: '1px solid #1a1a2e', fontSize: '12px',
    background: type.includes('ERROR') || type.includes('FAIL') ? 'rgba(244,67,54,0.1)' : 'transparent',
  }),
  eventSeq: { color: '#555' },
  eventType: (type: string) => ({
    color: type.includes('BETRAYAL') || type.includes('TRAUMA') || type.includes('ATTACK') ? '#f44336'
      : type.includes('KINDNESS') || type.includes('SUCCESS') || type.includes('GOAL_COMPLETED') ? '#4caf50'
      : type.includes('MEMORY') ? '#9c27b0'
      : type.includes('EMOTION') ? '#ff9800'
      : '#2196f3',
    fontWeight: 'bold' as const,
  }),
  eventNpc: { color: '#888' },
  eventData: { color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  eventTime: { color: '#555', fontSize: '11px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' },
  th: { textAlign: 'left' as const, padding: '6px', borderBottom: '2px solid #333', color: '#888', fontSize: '11px' },
  td: { padding: '6px', borderBottom: '1px solid #1a1a2e', color: '#ccc' },
  tableRow: { ':hover': { background: '#1a1a2e' } } as any,
  forgottenRow: { opacity: 0.4, fontStyle: 'italic' } as any,
  statsRow: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const },
  statCard: { background: '#1a1a2e', padding: '8px 16px', borderRadius: '4px', border: '1px solid #333', textAlign: 'center' as const },
  statValue: { fontSize: '20px', fontWeight: 'bold' as const, color: '#e94560' },
  statLabel: { fontSize: '10px', color: '#888', textTransform: 'uppercase' as const },
  splitView: { display: 'flex', gap: '12px' },
  leftPanel: { flex: 1, border: '1px solid #333', borderRadius: '4px', padding: '8px' },
  rightPanel: { flex: 1, border: '1px solid #333', borderRadius: '4px', padding: '8px' },
  subTitle: { fontSize: '14px', color: '#888', marginBottom: '8px' },
  planInfo: { fontSize: '12px', color: '#aaa', marginBottom: '4px' },
  planSteps: { marginTop: '8px' },
  planStep: { background: '#1a1a2e', padding: '8px', borderRadius: '4px', marginBottom: '4px', border: '1px solid #333' },
  stepNumber: { display: 'inline-block', background: '#e94560', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', textAlign: 'center' as const, lineHeight: '20px', fontSize: '11px', marginRight: '6px' },
  stepName: { fontWeight: 'bold' as const, color: '#e94560' },
  stepCost: { color: '#888', fontSize: '11px', marginLeft: '8px' },
  stepEffects: { fontSize: '11px', color: '#666', marginTop: '4px' },
  actionCard: { background: '#1a1a2e', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px', border: '1px solid #333' },
  actionName: { fontWeight: 'bold' as const, color: '#2196f3', fontSize: '12px' },
  actionDetails: { fontSize: '11px', color: '#666', marginTop: '2px' },
  padContainer: { display: 'flex', gap: '20px', marginBottom: '16px' },
  padSection: { flex: 1 },
  barRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  barLabel: { width: '80px', fontSize: '12px', color: '#aaa' },
  barContainer: { flex: 1, height: '20px', background: '#1a1a2e', borderRadius: '4px', border: '1px solid #333', position: 'relative' as const },
  barFill: (value: number, color: string) => ({
    position: 'absolute' as const,
    left: '50%',
    width: `${Math.abs(value) * 50}%`,
    height: '100%',
    background: color,
    borderRadius: value >= 0 ? '0 4px 4px 0' : '4px 0 0 4px',
    transform: value >= 0 ? 'none' : 'translateX(-100%)',
  }),
  barFillPositive: (value: number, color: string) => ({
    position: 'absolute' as const,
    left: '0',
    width: `${value}%`,
    height: '100%',
    background: color,
    borderRadius: '4px',
  }),
  barValue: { width: '50px', textAlign: 'right' as const, fontSize: '12px', color: '#888' },
  moodBadge: (mood: string) => ({
    background: mood === 'excited' || mood === 'content' || mood === 'confident' ? '#4caf50'
      : mood === 'terrified' || mood === 'angry' || mood === 'stressed' ? '#f44336'
      : '#333',
    color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
  }),
  padSpace: { display: 'flex', gap: '20px', alignItems: 'center', marginTop: '16px' },
  padLegend: { fontSize: '12px', color: '#888' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' },
  legendDot: (color: string) => ({ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }),
  goalCard: (status: string) => ({
    background: '#1a1a2e', padding: '12px', borderRadius: '4px', marginBottom: '8px',
    border: `1px solid ${status === 'completed' ? '#4caf50' : status === 'in_progress' ? '#2196f3' : status === 'failed' ? '#f44336' : '#333'}`,
  }),
  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  goalTitle: { fontWeight: 'bold' as const, color: '#e0e0e0' },
  goalStatus: (status: string) => ({
    fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
    background: status === 'completed' ? '#4caf50' : status === 'in_progress' ? '#2196f3' : status === 'failed' ? '#f44336' : '#333',
    color: '#fff',
  }),
  goalMeta: { fontSize: '11px', color: '#888', marginBottom: '4px' },
  progressBar: { height: '6px', background: '#1a1a2e', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#e94560', borderRadius: '3px' },
  goalDesc: { fontSize: '11px', color: '#666', marginTop: '4px' },
  needRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  needLabel: { width: '80px', fontSize: '12px', color: '#aaa' },
  needBarContainer: { flex: 1, height: '20px', background: '#1a1a2e', borderRadius: '4px', border: '1px solid #333', overflow: 'hidden' },
  needBarFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s' },
  needValue: { width: '30px', textAlign: 'right' as const, fontSize: '12px', color: '#888' },
  needUrgency: (value: number) => ({
    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
    background: value > 70 ? '#f44336' : value > 40 ? '#ff9800' : '#4caf50',
    color: '#fff',
  }),
  decisionCard: (success: boolean) => ({
    background: '#1a1a2e', padding: '10px', borderRadius: '4px', marginBottom: '6px',
    border: `1px solid ${success ? '#4caf50' : '#f44336'}`,
  }),
  decisionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  decisionAction: { fontWeight: 'bold' as const, color: '#e94560' },
  decisionSuccess: (success: boolean) => ({
    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
    background: success ? '#4caf50' : '#f44336', color: '#fff',
  }),
  decisionReasoning: { fontSize: '11px', color: '#aaa', marginTop: '4px' },
  decisionMeta: { fontSize: '10px', color: '#555', marginTop: '2px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' },
  perfCard: { background: '#1a1a2e', padding: '12px', borderRadius: '4px', border: '1px solid #333', textAlign: 'center' as const },
  perfValue: { fontSize: '24px', fontWeight: 'bold' as const, color: '#e94560' },
  perfLabel: { fontSize: '10px', color: '#888', textTransform: 'uppercase' as const },
  sandboxInfo: { fontSize: '12px', color: '#888', marginBottom: '8px' },
  logLine: { fontSize: '12px', color: '#aaa', padding: '2px 0', borderBottom: '1px solid #1a1a2e' },
  buttonRow: { display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' as const },
  textArea: { width: '100%', height: '300px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', color: '#e0e0e0', fontFamily: 'monospace', fontSize: '12px', padding: '8px', marginBottom: '8px', resize: 'vertical' as const },
  statusMsg: { fontSize: '12px', color: '#4caf50', marginTop: '4px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#aaa' },
  logLineRow: (level: string) => ({
    display: 'grid', gridTemplateColumns: '100px 60px 1fr', gap: '8px',
    padding: '3px 6px', borderBottom: '1px solid #1a1a2e', fontSize: '11px',
    background: level === 'error' ? 'rgba(244,67,54,0.1)' : 'transparent',
  }),
  logTime: { color: '#555' },
  logLevel: (level: string) => ({
    color: level === 'error' ? '#f44336' : '#4caf50',
    fontWeight: 'bold' as const,
  }),
  logMessage: { color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  triggerBtn: (type: string) => ({
    background: type === 'betrayal' || type === 'attack' ? '#f44336'
      : type === 'reward' || type === 'item_found' ? '#4caf50'
      : type === 'conversation' ? '#2196f3'
      : '#9c27b0',
    color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 12px',
    cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize' as const,
    opacity: 1,
  }),
};
