import type { CognitiveEventBus } from './event-bus';
import type {
  WorldLocation,
  WorldFact,
  WorldEventType,
  WorldEvent,
  WorldState,
  NPCId,
  CognitiveEventType,
} from '../types';

const HOURS_PER_DAY = 24;
const DAYS_PER_SEASON = 30;
const SEASONS: WorldState['season'][] = ['spring', 'summer', 'autumn', 'winter'];

const DEFAULT_LOCATIONS: WorldLocation[] = [
  { id: 'town_square', name: 'Town Square', type: 'public', x: 0, y: 0, capacity: 100, currentOccupants: [] },
  { id: 'market', name: 'Market', type: 'commercial', x: 50, y: 0, capacity: 50, currentOccupants: [] },
  { id: 'tavern', name: 'Tavern', type: 'social', x: -50, y: 20, capacity: 40, currentOccupants: [] },
  { id: 'library', name: 'Library', type: 'educational', x: 30, y: 40, capacity: 30, currentOccupants: [] },
  { id: 'temple', name: 'Temple', type: 'religious', x: -30, y: -30, capacity: 60, currentOccupants: [] },
  { id: 'forest', name: 'Forest', type: 'wilderness', x: 100, y: 100, capacity: 999, currentOccupants: [] },
  { id: 'farm', name: 'Farm', type: 'agricultural', x: 80, y: -50, capacity: 20, currentOccupants: [] },
  { id: 'mine', name: 'Mine', type: 'industrial', x: -100, y: 80, capacity: 30, currentOccupants: [] },
];

const DEFAULT_FACTS: WorldFact[] = [
  { id: 'fact_world_creation', content: 'The world was forged by the Ancients.', timestamp: 0, knownBy: [], category: 'history' },
  { id: 'fact_king_name', content: 'The current ruler is King Aldric.', timestamp: 0, knownBy: [], category: 'politics' },
  { id: 'fact_dragon_sighting', content: 'A dragon was sighted near the mountains.', timestamp: 0, knownBy: [], category: 'rumor' },
  { id: 'fact_herb_location', content: 'Rare herbs grow in the northern forest.', timestamp: 0, knownBy: [], category: 'nature' },
  { id: 'fact_market_schedule', content: 'The market opens at dawn each day.', timestamp: 0, knownBy: [], category: 'economy' },
  { id: 'fact_old_curse', content: 'An ancient curse lies upon the old temple.', timestamp: 0, knownBy: [], category: 'myth' },
  { id: 'fact_trade_route', content: 'A secret trade route connects the forest to the mine.', timestamp: 0, knownBy: [], category: 'economy' },
  { id: 'fact_season_omen', content: 'Red skies at dawn foretell a harsh winter.', timestamp: 0, knownBy: [], category: 'superstition' },
];

const WORLD_EVENT_TYPES: WorldEventType[] = [
  'storm',
  'festival',
  'plague',
  'drought',
  'invasion',
  'discovery',
  'migration',
  'market_crash',
];

const WEATHER_STATES: WorldState['weather'][] = [
  'clear', 'cloudy', 'rain', 'storm', 'snow', 'fog',
];

let factIdCounter = 0;
let eventIdCounter = 0;

function generateFactId(): string {
  factIdCounter += 1;
  return `fact_${Date.now()}_${factIdCounter}`;
}

function generateEventId(): string {
  eventIdCounter += 1;
  return `wevt_${Date.now()}_${eventIdCounter}`;
}

function emptyEconomicImpact(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const type of ['food', 'water', 'weapon', 'tool', 'medicine', 'clothing', 'luxury', 'material', 'book']) {
    result[type] = 0;
  }
  return result;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seasonFromDay(day: number): WorldState['season'] {
  const seasonIndex = Math.floor(((day - 1) / DAYS_PER_SEASON) % SEASONS.length);
  return SEASONS[seasonIndex];
}

function weatherForSeason(season: WorldState['season']): WorldState['weather'] {
  const r = Math.random();
  switch (season) {
    case 'spring':
      return r < 0.5 ? 'clear' : r < 0.8 ? 'rain' : 'cloudy';
    case 'summer':
      return r < 0.7 ? 'clear' : r < 0.9 ? 'cloudy' : 'storm';
    case 'autumn':
      return r < 0.4 ? 'clear' : r < 0.7 ? 'cloudy' : r < 0.9 ? 'rain' : 'fog';
    case 'winter':
      return r < 0.4 ? 'snow' : r < 0.7 ? 'cloudy' : r < 0.9 ? 'clear' : 'fog';
  }
}

export class WorldKnowledge {
  private eventBus: CognitiveEventBus;
  private locations: Map<string, WorldLocation> = new Map();
  private facts: Map<string, WorldFact> = new Map();
  private activeEvents: WorldEvent[] = [];
  private knownFactsByNPC: Map<NPCId, Set<string>> = new Map();
  private currentMs = 0;
  private day = 1;
  private hour = 0;
  private season: WorldState['season'] = 'spring';
  private weather: WorldState['weather'] = 'clear';

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    for (const loc of DEFAULT_LOCATIONS) {
      this.locations.set(loc.id, { ...loc, currentOccupants: [...loc.currentOccupants] });
    }
    for (const fact of DEFAULT_FACTS) {
      this.facts.set(fact.id, { ...fact, knownBy: [...fact.knownBy] });
    }
    this.season = seasonFromDay(this.day);
    this.weather = weatherForSeason(this.season);
  }

  tick(currentMs: number): WorldState {
    const deltaMs = Math.max(0, currentMs - this.currentMs);
    this.currentMs = currentMs;

    const hoursElapsed = Math.floor(deltaMs / (1000 * 60 * 60));
    if (hoursElapsed > 0) {
      const prevHour = this.hour;
      const prevDay = this.day;
      const prevSeason = this.season;
      const prevWeather = this.weather;

      const totalHours = (this.day - 1) * HOURS_PER_DAY + this.hour + hoursElapsed;
      this.day = Math.floor(totalHours / HOURS_PER_DAY) + 1;
      this.hour = totalHours % HOURS_PER_DAY;
      this.season = seasonFromDay(this.day);
      this.weather = weatherForSeason(this.season);

      if (prevHour !== this.hour) {
        this.eventBus.emit({
          type: 'WORLD_TIME_CHANGED' as CognitiveEventType,
          source: 'world-knowledge',
          data: {
            day: this.day,
            hour: this.hour,
            season: this.season,
          },
        });
      }
      if (prevSeason !== this.season) {
        this.eventBus.emit({
          type: 'WORLD_TIME_CHANGED' as CognitiveEventType,
          source: 'world-knowledge',
          data: {
            seasonChanged: true,
            prevSeason: prevSeason,
            season: this.season,
            day: this.day,
          },
        });
      }
      if (prevWeather !== this.weather) {
        this.eventBus.emit({
          type: 'WORLD_WEATHER_CHANGED' as CognitiveEventType,
          source: 'world-knowledge',
          data: {
            prevWeather: prevWeather,
            weather: this.weather,
            season: this.season,
          },
        });
      }
    }

    const expired: WorldEvent[] = [];
    const remaining: WorldEvent[] = [];
    const now = Date.now();
    for (const evt of this.activeEvents) {
      if (now - evt.timestamp >= evt.duration) {
        expired.push(evt);
      } else {
        remaining.push(evt);
      }
    }
    this.activeEvents = remaining;

    return this.getWorldState();
  }

  addFact(content: string, category: string, knownBy: NPCId[] = []): WorldFact {
    const fact: WorldFact = {
      id: generateFactId(),
      content,
      timestamp: Date.now(),
      knownBy: [...knownBy],
      category,
    };
    this.facts.set(fact.id, fact);
    return fact;
  }

  learnFact(npcId: NPCId, factId: string): boolean {
    const fact = this.facts.get(factId);
    if (!fact) return false;

    let known = this.knownFactsByNPC.get(npcId);
    if (!known) {
      known = new Set();
      this.knownFactsByNPC.set(npcId, known);
    }
    if (known.has(factId)) return true;
    known.add(factId);

    if (!fact.knownBy.includes(npcId)) {
      fact.knownBy.push(npcId);
    }

    this.eventBus.emit({
      type: 'WORLD_FACT_LEARNED' as CognitiveEventType,
      source: 'world-knowledge',
      npcId,
      data: {
        factId,
        content: fact.content,
        category: fact.category,
      },
    });

    return true;
  }

  triggerEvent(type: WorldEventType): WorldEvent {
    const affectedLocations = [...this.locations.keys()].slice(0, 3);
    const event: WorldEvent = {
      id: generateEventId(),
      type,
      timestamp: Date.now(),
      description: `World event: ${type}`,
      affectedLocations,
      economicImpact: emptyEconomicImpact(),
      duration: 1000 * 60 * 60 * 24,
    };

    this.activeEvents.push(event);

    this.eventBus.emit({
      type: 'WORLD_EVENT' as CognitiveEventType,
      source: 'world-knowledge',
      data: {
        eventId: event.id,
        type,
        description: event.description,
        affectedLocations,
        duration: event.duration,
      },
    });

    return event;
  }

  getWorldState(): WorldState {
    const locations: Record<string, WorldLocation> = {};
    for (const [id, loc] of this.locations) {
      locations[id] = { ...loc, currentOccupants: [...loc.currentOccupants] };
    }
    return {
      day: this.day,
      hour: this.hour,
      season: this.season,
      weather: this.weather,
      locations,
      facts: [...this.facts.values()],
      activeEvents: [...this.activeEvents],
    };
  }

  getLocations(): WorldLocation[] {
    return [...this.locations.values()];
  }

  getActiveEvents(): WorldEvent[] {
    return [...this.activeEvents];
  }
}

export {
  HOURS_PER_DAY as WORLD_HOURS_PER_DAY,
  DAYS_PER_SEASON as WORLD_DAYS_PER_SEASON,
  DEFAULT_LOCATIONS as WORLD_DEFAULT_LOCATIONS,
  DEFAULT_FACTS as WORLD_DEFAULT_FACTS,
  WORLD_EVENT_TYPES as WORLD_EVENT_TYPES,
  WEATHER_STATES as WORLD_WEATHER_STATES,
};
