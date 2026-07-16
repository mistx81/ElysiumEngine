import type { CognitiveEventBus } from './event-bus';
import type {
  PersonalityProfile,
  PersonalityDriftEvent,
  BigFiveTrait,
  NPCCore,
  CognitiveEventType,
} from '../types';

type DriftTrigger = 'betrayal' | 'kindness' | 'trauma' | 'success';

type DriftEffect = {
  trait: BigFiveTrait;
  delta: number;
};

const TRIGGER_EFFECTS: Record<DriftTrigger, DriftEffect[]> = {
  betrayal: [
    { trait: 'agreeableness', delta: -1 },
    { trait: 'neuroticism', delta: 1 },
  ],
  kindness: [
    { trait: 'agreeableness', delta: 1 },
    { trait: 'extraversion', delta: 1 },
  ],
  trauma: [
    { trait: 'neuroticism', delta: 1 },
    { trait: 'openness', delta: -1 },
    { trait: 'extraversion', delta: -1 },
  ],
  success: [
    { trait: 'conscientiousness', delta: 1 },
  ],
};

type NPCDriftData = {
  history: PersonalityDriftEvent[];
  totalDrift: Record<BigFiveTrait, number>;
};

function clampTrait(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function ensureDriftData(): NPCDriftData {
  return {
    history: [],
    totalDrift: {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    },
  };
}

export class PersonalityDriftEngine {
  private eventBus: CognitiveEventBus;
  private npcData: Map<string, NPCDriftData> = new Map();

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  private getData(npcId: string): NPCDriftData {
    let data = this.npcData.get(npcId);
    if (!data) {
      data = ensureDriftData();
      this.npcData.set(npcId, data);
    }
    return data;
  }

  processExperience(
    npc: NPCCore,
    type: DriftTrigger,
    intensity: number,
  ): PersonalityProfile {
    const data = this.getData(npc.id);
    const effects = TRIGGER_EFFECTS[type];
    const now = Date.now();
    const scaledIntensity = Math.max(0, intensity);

    for (const effect of effects) {
      const actualDelta = effect.delta * scaledIntensity;
      const oldValue = npc.personality[effect.trait];
      const newValue = clampTrait(oldValue + actualDelta);

      npc.personality[effect.trait] = newValue;

      const driftEvent: PersonalityDriftEvent = {
        trait: effect.trait,
        delta: actualDelta,
        reason: type,
        timestamp: now,
      };

      data.history.push(driftEvent);
      data.totalDrift[effect.trait] += actualDelta;
    }

    this.eventBus.emit({
      type: 'PERSONALITY_DRIFTED' as CognitiveEventType,
      source: 'personality-drift',
      npcId: npc.id,
      data: {
        trigger: type,
        intensity: scaledIntensity,
        effects: effects.map((e) => ({
          trait: e.trait,
          delta: e.delta * scaledIntensity,
        })),
        personality: { ...npc.personality },
      },
    });

    return { ...npc.personality };
  }

  getDriftHistory(npcId: string): PersonalityDriftEvent[] {
    const data = this.npcData.get(npcId);
    return data ? [...data.history] : [];
  }

  getTotalDrift(npcId: string): Record<BigFiveTrait, number> {
    const data = this.npcData.get(npcId);
    if (!data) {
      return {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      };
    }
    return { ...data.totalDrift };
  }
}

export { TRIGGER_EFFECTS as PERSONALITY_DRIFT_TRIGGERS };
export type { DriftTrigger as PersonalityDriftTrigger };
