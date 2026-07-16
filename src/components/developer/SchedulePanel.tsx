import type { DailySchedule, NPCCore, ScheduleSlot } from '../../engine/types';

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

const tableStyle: Record<string, any> = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
};

const thStyle: Record<string, any> = {
  textAlign: 'left',
  padding: '6px 8px',
  color: COLORS.textDim,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: 11,
  textTransform: 'uppercase',
};

const tdStyle: Record<string, any> = {
  padding: '6px 8px',
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.text,
};

const priorityColor = (p: number): string => {
  if (p >= 8) return COLORS.error;
  if (p >= 5) return COLORS.warning;
  return COLORS.success;
};

const statusLabel = (slot: ScheduleSlot, currentIndex: number, idx: number): string => {
  if (idx === currentIndex) return 'ACTIVE';
  if (idx < currentIndex) return 'DONE';
  return 'PENDING';
};

const statusColor = (status: string): string => {
  if (status === 'ACTIVE') return COLORS.accent;
  if (status === 'DONE') return COLORS.success;
  return COLORS.textDim;
};

export default function SchedulePanel(props: any) {
  const selectedNPC: NPCCore | undefined = props.selectedNPC;
  const schedStats: any = props.schedStats || {};
  const currentHour: number = props.currentHour ?? props.worldHour ?? 0;

  const schedule: DailySchedule | null = selectedNPC ? selectedNPC.schedule : null;

  if (!selectedNPC || !schedule) {
    return (
      <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>SCHEDULE MONITOR</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {selectedNPC ? `${selectedNPC.name} — No Schedule` : 'No NPC Selected'}
          </div>
          <div style={{ color: COLORS.textDim, marginTop: 12, padding: 16, textAlign: 'center' }}>
            {selectedNPC
              ? 'This NPC has no daily schedule assigned.'
              : 'Select an NPC to view their daily schedule.'}
          </div>
        </div>
      </div>
    );
  }

  const slots = schedule.slots;
  const currentIndex = schedule.currentSlotIndex;
  const totalSlots = slots.length;
  const totalHours = slots.reduce((s, slot) => s + (slot.endHour - slot.startHour), 0);
  const avgPriority = totalSlots > 0 ? slots.reduce((s, slot) => s + slot.priority, 0) / totalSlots : 0;

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>SCHEDULE MONITOR</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{selectedNPC.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>DAY</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent }}>{schedule.day}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>24h Timeline</div>
        <div style={{ display: 'flex', height: 32, borderRadius: 4, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
          {Array.from({ length: 24 }, (_, h) => {
            const slot = slots.find((s) => h >= s.startHour && h < s.endHour);
            const isActiveSlot = slot && slots.indexOf(slot) === currentIndex;
            const bg = isActiveSlot ? COLORS.accent : slot ? COLORS.info : COLORS.bg;
            return (
              <div
                key={h}
                style={{
                  flex: 1,
                  background: bg,
                  borderRight: `1px solid ${COLORS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  color: slot ? '#0a0e17' : COLORS.textDim,
                  fontWeight: 700,
                }}
                title={slot ? `${slot.activity} (${h}:00)` : `Free (${h}:00)`}
              >
                {h % 6 === 0 ? `${h}` : ''}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: COLORS.textDim }}>
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Current Task</div>
        {slots[currentIndex] ? (
          <div style={{ padding: 8, background: COLORS.bg, borderRadius: 6, border: `1px solid ${COLORS.accent}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{slots[currentIndex].activity}</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
              {slots[currentIndex].startHour}:00 — {slots[currentIndex].endHour}:00 · {slots[currentIndex].location}
            </div>
          </div>
        ) : (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No active task</div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Task List</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Start</th>
              <th style={thStyle}>End</th>
              <th style={thStyle}>Activity</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Pri</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, idx) => {
              const status = statusLabel(slot, currentIndex, idx);
              return (
                <tr key={idx} style={{ background: idx === currentIndex ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
                  <td style={tdStyle}>{slot.startHour}:00</td>
                  <td style={tdStyle}>{slot.endHour}:00</td>
                  <td style={tdStyle}>{slot.activity}</td>
                  <td style={{ ...tdStyle, color: COLORS.textDim }}>{slot.location}</td>
                  <td style={{ ...tdStyle, color: priorityColor(slot.priority), fontWeight: 700 }}>{slot.priority}</td>
                  <td style={{ ...tdStyle, color: statusColor(status), fontWeight: 700, fontSize: 10 }}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Schedule Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ padding: 8, background: COLORS.bg, borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.info }}>{totalSlots}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Slots</div>
          </div>
          <div style={{ padding: 8, background: COLORS.bg, borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.success }}>{totalHours}h</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Scheduled Hours</div>
          </div>
          <div style={{ padding: 8, background: COLORS.bg, borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.warning }}>{avgPriority.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>Avg Priority</div>
          </div>
        </div>
        {schedStats.ticks !== undefined && (
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textDim }}>
            Ticks: {schedStats.ticks} · Avg Tick: {schedStats.avgTickMs?.toFixed(2) ?? '—'}ms
          </div>
        )}
      </div>
    </div>
  );
}
