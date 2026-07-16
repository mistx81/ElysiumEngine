import type { NPCCore, EmotionLabel } from '../../engine/types';

const COLORS: Record<string, string> = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  muted: '#64748b',
};

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  joy: COLORS.success,
  sadness: COLORS.info,
  anger: COLORS.error,
  fear: '#a855f7',
  disgust: '#84cc16',
  surprise: COLORS.warning,
};

const EMOTIONS: EmotionLabel[] = ['joy', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];

export default function PADPanel(props: any) {
  const npc: NPCCore | null = props.selectedNPC ?? null;
  const emotionHistory: number[][] = props.emotionHistory ?? [];

  const styles: Record<string, any> = {
    container: { background: COLORS.bg, color: COLORS.text, padding: '16px', fontFamily: 'monospace', fontSize: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '15px', fontWeight: 700, margin: 0 },
    moodBadge: { padding: '4px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
    section: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px' },
    sectionTitle: { fontSize: '11px', fontWeight: 700, marginBottom: '10px', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
    padBar: { marginBottom: '14px' },
    padLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' },
    padTrack: { position: 'relative', height: '8px', background: COLORS.border, borderRadius: '4px', overflow: 'hidden' },
    padCenter: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: COLORS.muted, zIndex: 1 },
    padFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: '4px' },
    emotionBar: { marginBottom: '10px' },
    emotionLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' },
    emotionTrack: { height: '8px', background: COLORS.border, borderRadius: '4px', overflow: 'hidden' },
    emotionFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s' },
    sparkline: { width: '100%', height: '60px', background: COLORS.bg, borderRadius: '4px', border: `1px solid ${COLORS.border}` },
    placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.muted, fontSize: '14px' },
  };

  if (!npc) {
    return <div style={styles.container}><div style={styles.placeholder}>Select an NPC to view emotional state</div></div>;
  }

  const { pad, emotions, mood } = npc.emotions;
  const moodColor = pad.pleasure > 0.2 ? COLORS.success : pad.pleasure < -0.2 ? COLORS.error : COLORS.muted;

  const renderPADBar = (label: string, value: number, color: string) => {
    const pct = Math.abs(value) * 50;
    const isPositive = value >= 0;
    return (
      <div key={label} style={styles.padBar}>
        <div style={styles.padLabel}>
          <span>{label}</span>
          <span style={{ color }}>{value >= 0 ? '+' : ''}{value.toFixed(3)}</span>
        </div>
        <div style={styles.padTrack}>
          <div style={styles.padCenter} />
          <div style={{
            ...styles.padFill,
            width: `${pct}%`,
            left: isPositive ? '50%' : `${50 - pct}%`,
            background: color,
          }} />
        </div>
      </div>
    );
  };

  const renderSparkline = () => {
    if (emotionHistory.length === 0) return <div style={{ ...styles.placeholder, height: '60px', fontSize: '10px' }}>No history</div>;
    const w = 280, h = 60, pad = 4;
    const maxLen = Math.max(...emotionHistory.map((s) => s.length), 1);
    const colors = [COLORS.success, COLORS.info, COLORS.error, '#a855f7', '#84cc16', COLORS.warning];
    return (
      <svg style={styles.sparkline} viewBox={`0 0 ${w} ${h}`}>
        {emotionHistory.map((series, si) => {
          if (series.length < 2) return null;
          const points = series.map((v, i) => {
            const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
            const y = h - pad - (v / 100) * (h - pad * 2);
            return `${x},${y}`;
          }).join(' ');
          return <polyline key={si} points={points} fill="none" stroke={colors[si % colors.length]} strokeWidth="1.5" opacity="0.8" />;
        })}
      </svg>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>PAD Model — {npc.name}</h3>
        <span style={{ ...styles.moodBadge, background: moodColor, color: '#fff' }}>{mood}</span>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Pleasure — Arousal — Dominance</div>
        {renderPADBar('Pleasure', pad.pleasure, COLORS.accent)}
        {renderPADBar('Arousal', pad.arousal, COLORS.warning)}
        {renderPADBar('Dominance', pad.dominance, COLORS.success)}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Discrete Emotions</div>
        {EMOTIONS.map((emo) => {
          const val = emotions[emo] ?? 0;
          return (
            <div key={emo} style={styles.emotionBar}>
              <div style={styles.emotionLabel}>
                <span style={{ color: EMOTION_COLORS[emo] }}>{emo}</span>
                <span>{val.toFixed(1)}</span>
              </div>
              <div style={styles.emotionTrack}>
                <div style={{ ...styles.emotionFill, width: `${Math.min(100, val)}%`, background: EMOTION_COLORS[emo] }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Emotion History</div>
        {renderSparkline()}
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
          {EMOTIONS.map((emo, i) => (
            <span key={emo} style={{ fontSize: '9px', color: COLORS.muted }}>
              <span style={{ display: 'inline-block', width: '8px', height: '2px', background: [COLORS.success, COLORS.info, COLORS.error, '#a855f7', '#84cc16', COLORS.warning][i], marginRight: '4px', verticalAlign: 'middle' }} />
              {emo}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
