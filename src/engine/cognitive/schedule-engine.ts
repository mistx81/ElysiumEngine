import type { CognitiveEventBus } from './event-bus';
import type {
  ScheduleSlot,
  DailySchedule,
  NPCCore,
  NPCId,
  CognitiveEventType,
} from '../types';

const SCHEDULE_SLOTS: { startHour: number; endHour: number }[] = [
  { startHour: 0, endHour: 3 },
  { startHour: 3, endHour: 6 },
  { startHour: 6, endHour: 9 },
  { startHour: 9, endHour: 12 },
  { startHour: 12, endHour: 15 },
  { startHour: 15, endHour: 18 },
  { startHour: 18, endHour: 21 },
  { startHour: 21, endHour: 24 },
];

const ACTIVITIES = [
  'sleep',
  'eat',
  'work',
  'socialize',
  'explore',
  'rest',
  'trade',
  'learn',
  'leisure',
] as const;

type Activity = (typeof ACTIVITIES)[number];

const DEFAULT_SLOT_ACTIVITIES: Activity[] = [
  'sleep',
  'sleep',
  'eat',
  'work',
  'eat',
  'work',
  'socialize',
  'rest',
];

const ACTIVITY_LOCATIONS: Record<Activity, string> = {
  sleep: 'home',
  eat: 'kitchen',
  work: 'workplace',
  socialize: 'town_square',
  explore: 'wilderness',
  rest: 'home',
  trade: 'market',
  learn: 'library',
  leisure: 'home',
};

let slotIdCounter = 0;

function generateSlotId(): string {
  slotIdCounter += 1;
  return `slot_${slotIdCounter}`;
}

function pickActivityForSlot(
  index: number,
  npc: NPCCore,
): Activity {
  const base = DEFAULT_SLOT_ACTIVITIES[index] ?? 'rest';
  const p = npc.personality;

  if (index === 0 || index === 1) {
    if (p.neuroticism > 70) return 'rest';
    return 'sleep';
  }

  if (index === 2) return 'eat';
  if (index === 4) return 'eat';

  if (index === 3 || index === 5) {
    if (p.openness > 70) return 'explore';
    if (p.extraversion > 70) return 'socialize';
    if (p.conscientiousness > 70) return 'work';
    return base;
  }

  if (index === 6) {
    if (p.extraversion > 60) return 'socialize';
    if (p.openness > 60) return 'learn';
    return 'leisure';
  }

  if (index === 7) {
    if (p.neuroticism > 60) return 'rest';
    return 'leisure';
  }

  return base;
}

function buildSlot(index: number, activity: Activity): ScheduleSlot {
  const span = SCHEDULE_SLOTS[index];
  return {
    id: generateSlotId(),
    startHour: span.startHour,
    endHour: span.endHour,
    activity,
    location: ACTIVITY_LOCATIONS[activity],
    priority: index === 0 || index === 1 ? 10 : 5,
    flexibility: index >= 3 && index <= 5 ? 0.3 : 0.6,
  };
}

export class ScheduleEngine {
  private eventBus: CognitiveEventBus;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  generateSchedule(npc: NPCCore): DailySchedule {
    const slots: ScheduleSlot[] = [];
    for (let i = 0; i < SCHEDULE_SLOTS.length; i++) {
      const activity = pickActivityForSlot(i, npc);
      slots.push(buildSlot(i, activity));
    }

    const schedule: DailySchedule = {
      npcId: npc.id,
      slots,
      currentSlotIndex: 0,
      day: 1,
    };

    npc.schedule = schedule;
    return schedule;
  }

  tick(schedule: DailySchedule, hour: number): ScheduleSlot | null {
    const slot = this.getCurrentSlot(schedule, hour);
    if (!slot) return null;

    const prevIndex = schedule.currentSlotIndex;
    const newIndex = schedule.slots.indexOf(slot);
    schedule.currentSlotIndex = newIndex;

    this.eventBus.emit({
      type: 'SCHEDULE_TICK' as CognitiveEventType,
      source: 'schedule-engine',
      npcId: schedule.npcId,
      data: {
        hour,
        slotId: slot.id,
        activity: slot.activity,
        location: slot.location,
      },
    });

    if (newIndex !== prevIndex) {
      this.eventBus.emit({
        type: 'SCHEDULE_TASK_STARTED' as CognitiveEventType,
        source: 'schedule-engine',
        npcId: schedule.npcId,
        data: {
          slotId: slot.id,
          activity: slot.activity,
          location: slot.location,
          hour,
        },
      });

      const prevSlot = schedule.slots[prevIndex];
      if (prevSlot && prevIndex !== newIndex) {
        this.eventBus.emit({
          type: 'SCHEDULE_TASK_COMPLETED' as CognitiveEventType,
          source: 'schedule-engine',
          npcId: schedule.npcId,
          data: {
            slotId: prevSlot.id,
            activity: prevSlot.activity,
            hour,
          },
        });
      }
    }

    return slot;
  }

  getCurrentSlot(schedule: DailySchedule, hour: number): ScheduleSlot | null {
    const h = ((hour % 24) + 24) % 24;
    for (const slot of schedule.slots) {
      if (h >= slot.startHour && h < slot.endHour) {
        return slot;
      }
    }
    const last = schedule.slots[schedule.slots.length - 1];
    return last ?? null;
  }

  adaptSchedule(npc: NPCCore, schedule: DailySchedule): DailySchedule {
    const p = npc.personality;
    const adaptedSlots = schedule.slots.map((slot, index) => {
      let activity = slot.activity as Activity;

      if (slot.activity === 'work' && p.conscientiousness < 30) {
        activity = 'leisure';
      }
      if (slot.activity === 'socialize' && p.extraversion < 30) {
        activity = 'rest';
      }
      if (slot.activity === 'explore' && p.openness < 30) {
        activity = 'work';
      }
      if (slot.activity === 'learn' && p.openness < 20) {
        activity = 'leisure';
      }

      if (activity === slot.activity) return slot;

      return {
        ...slot,
        activity,
        location: ACTIVITY_LOCATIONS[activity],
      };
    });

    const adapted: DailySchedule = {
      ...schedule,
      slots: adaptedSlots,
    };

    npc.schedule = adapted;
    return adapted;
  }
}

export { SCHEDULE_SLOTS, ACTIVITIES as SCHEDULE_ACTIVITIES, ACTIVITY_LOCATIONS };
export type { Activity as ScheduleActivity };
