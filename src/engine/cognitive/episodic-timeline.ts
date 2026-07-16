import type { CognitiveEventBus } from './event-bus';
import type {
  EpisodicEvent,
  NPCId,
  CognitiveEventType,
} from '../types';

type NPCTimeline = {
  events: EpisodicEvent[];
};

export class EpisodicTimeline {
  private eventBus: CognitiveEventBus;
  private timelines: Map<NPCId, NPCTimeline> = new Map();
  private idCounter = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  private getTimelineData(npcId: NPCId): NPCTimeline {
    let data = this.timelines.get(npcId);
    if (!data) {
      data = { events: [] };
      this.timelines.set(npcId, data);
    }
    return data;
  }

  addEvent(
    npcId: NPCId,
    type: string,
    description: string,
    emotionalValence: number,
    participants: NPCId[] = [],
    location = 'unknown',
  ): EpisodicEvent {
    const data = this.getTimelineData(npcId);
    const event: EpisodicEvent = {
      id: `epi_${Date.now()}_${++this.idCounter}`,
      npcId,
      timestamp: Date.now(),
      type,
      description,
      emotionalValence,
      participants,
      location,
    };

    data.events.push(event);

    this.eventBus.emit({
      type: 'EPISODIC_ADDED' as CognitiveEventType,
      source: 'episodic-timeline',
      npcId,
      data: {
        eventId: event.id,
        type,
        description,
        emotionalValence,
        participants,
        location,
      },
    });

    return event;
  }

  getEvents(npcId: NPCId, limit?: number): EpisodicEvent[] {
    const data = this.timelines.get(npcId);
    if (!data) return [];
    const events = [...data.events];
    if (limit !== undefined && limit > 0) {
      return events.slice(-limit);
    }
    return events;
  }

  getEventsInRange(npcId: NPCId, start: number, end: number): EpisodicEvent[] {
    const data = this.timelines.get(npcId);
    if (!data) return [];
    return data.events.filter(
      (e) => e.timestamp >= start && e.timestamp <= end,
    );
  }

  getTimeline(npcId: NPCId): EpisodicEvent[] {
    const data = this.timelines.get(npcId);
    if (!data) return [];
    this.eventBus.emit({
      type: 'EPISODIC_RECALLED' as CognitiveEventType,
      source: 'episodic-timeline',
      npcId,
      data: {
        eventCount: data.events.length,
      },
    });
    return [...data.events];
  }
}
