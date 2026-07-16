import type { CognitiveEvent, WorldEvent, WorldFact, WorldLocation, WorldState } from '../../engine/types';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const cardStyle: Record<string, any> = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

const headerStyle: Record<string, any> = {
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.text,
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const btnBase: Record<string, any> = {
  padding: '8px 16px',
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.card,
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  textTransform: 'uppercase',
};

const weatherIcon = (w: string): string => {
  const map: Record<string, string> = {
    clear: '☀', cloudy: '☁', rain: '🌧', storm: '⛈', snow: '❄', fog: '🌫',
  };
  return map[w] || '?';
};

const seasonColor = (s: string): string => {
  const map: Record<string, string> = {
    spring: COLORS.success, summer: COLORS.warning, autumn: '#f97316', winter: COLORS.info,
  };
  return map[s] || COLORS.text;
};

export default function WorldPanel(props: any) {
  const worldState: WorldState | undefined = props.worldState;
  const events: CognitiveEvent[] = props.events || [];
  const startSim: () => void = props.startSim || (() => {});
  const stopSim: () => void = props.stopSim || (() => {});
  const isRunning: boolean = props.isRunning ?? false;
  const spawnEvent: () => void = props.spawnEvent || (() => {});

  if (!worldState) {
    return (
      <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>WORLD STATE</div>
          <div style={{ color: COLORS.textDim, marginTop: 12, padding: 16, textAlign: 'center' }}>
            No world state available. Start the simulation to initialize the world.
          </div>
        </div>
      </div>
    );
  }

  const activeEvents: WorldEvent[] = worldState.activeEvents || [];
  const facts: WorldFact[] = worldState.facts || [];
  const locations: WorldLocation[] = Object.values(worldState.locations || {});
  const worldEventLogs = events.filter((e) => e.type === 'WORLD_EVENT').slice(0, 8);

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>WORLD STATE</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>Day {worldState.day} · {worldState.hour}:00</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24 }}>{weatherIcon(worldState.weather)}</div>
          <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'capitalize' }}>{worldState.weather}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Time & Environment</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.accent }}>{worldState.hour}:00</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Hour</div>
          </div>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: seasonColor(worldState.season), textTransform: 'capitalize' }}>{worldState.season}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Season</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Time Advancement Controls</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{ ...btnBase, background: isRunning ? COLORS.card : COLORS.success, borderColor: COLORS.success, color: isRunning ? COLORS.text : '#0a0e17' }}
            onClick={startSim}
            disabled={isRunning}
          >
            ▶ Resume
          </button>
          <button
            style={{ ...btnBase, background: isRunning ? COLORS.warning : COLORS.card, borderColor: COLORS.warning, color: isRunning ? '#0a0e17' : COLORS.text }}
            onClick={stopSim}
            disabled={!isRunning}
          >
            ⏸ Pause
          </button>
          <button
            style={{ ...btnBase, borderColor: COLORS.accent, color: COLORS.accent }}
            onClick={startSim}
          >
            ⏩ Fast-Forward
          </button>
          <button
            style={{ ...btnBase, borderColor: COLORS.info, color: COLORS.info }}
            onClick={spawnEvent}
          >
            ✦ Spawn Event
          </button>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isRunning ? COLORS.success : COLORS.textDim,
            boxShadow: isRunning ? `0 0 6px ${COLORS.success}` : 'none',
          }} />
          <span style={{ fontSize: 11, color: COLORS.textDim }}>{isRunning ? 'Simulation Running' : 'Simulation Paused'}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Active Events ({activeEvents.length})</div>
        {activeEvents.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No active world events</div>
        ) : (
          activeEvents.map((ev, idx) => (
            <div key={idx} style={{ padding: 8, marginBottom: 6, background: COLORS.bg, borderRadius: 4, border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.warning, fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>{ev.type}</span>
                <span style={{ color: COLORS.textDim, fontSize: 10 }}>Duration: {ev.duration}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: COLORS.text }}>{ev.description}</div>
              {ev.affectedLocations.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textDim }}>
                  Affected: {ev.affectedLocations.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>World Facts ({facts.length})</div>
        {facts.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No knowledge entries</div>
        ) : (
          facts.slice(0, 10).map((fact, idx) => (
            <div key={idx} style={{ padding: '4px 0', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: COLORS.text, fontSize: 11 }}>{fact.content}</span>
              <span style={{ color: COLORS.info, fontSize: 10, marginLeft: 8 }}>{fact.category}</span>
            </div>
          ))
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Locations ({locations.length})</div>
        {locations.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No locations defined</div>
        ) : (
          locations.slice(0, 10).map((loc, idx) => (
            <div key={idx} style={{ padding: '4px 0', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: COLORS.text, fontSize: 11 }}>{loc.name}</span>
              <span style={{ color: COLORS.textDim, fontSize: 10 }}>
                {loc.currentOccupants.length}/{loc.capacity} · {loc.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
