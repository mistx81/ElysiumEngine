import type {
  CognitiveEventBus,
} from './event-bus';
import type {
  PADEmotions,
  EmotionLabel,
  MoodLabel,
  EmotionState,
  NPCCore,
  CognitiveEventType,
} from '../types';

const EMOTION_KEYS: EmotionLabel[] = [
  'joy',
  'sadness',
  'anger',
  'fear',
  'disgust',
  'surprise',
];

function clampPad(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function clampEmotion(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function scaleTo100(value: number): number {
  return clampEmotion((value + 1) * 50);
}

function computeEmotions(pad: PADEmotions): Record<EmotionLabel, number> {
  const { pleasure, arousal, dominance } = pad;

  const joy = clampEmotion(
    scaleTo100(pleasure * 0.5 + arousal * 0.3 + dominance * 0.2),
  );
  const sadness = clampEmotion(scaleTo100(-pleasure * 0.6));
  const anger = clampEmotion(
    scaleTo100(-pleasure * 0.3 + arousal * 0.4 + dominance * 0.3),
  );
  const fear = clampEmotion(
    scaleTo100(-pleasure * 0.3 + arousal * 0.5 - dominance * 0.2),
  );
  const disgust = clampEmotion(scaleTo100(-pleasure * 0.5 - arousal * 0.2));
  const surprise = clampEmotion(scaleTo100(arousal * 0.7 - dominance * 0.3));

  return { joy, sadness, anger, fear, disgust, surprise };
}

function computeMood(pad: PADEmotions): MoodLabel {
  const { pleasure, arousal, dominance } = pad;

  if (pleasure > 0.5 && arousal > 0.3) return 'euphoric';
  if (pleasure > 0.3 && arousal > 0) return 'happy';
  if (pleasure > 0.1 && arousal <= 0.1) return 'content';
  if (pleasure > 0 && arousal < -0.2 && dominance > 0) return 'calm';
  if (pleasure <= 0 && pleasure > -0.2 && arousal < -0.2) return 'bored';
  if (pleasure <= -0.2 && arousal <= 0) return 'sad';
  if (pleasure <= -0.1 && arousal > 0.3) return 'anxious';
  if (pleasure <= -0.3 && arousal > 0.3 && dominance > 0.2) return 'angry';
  return 'neutral';
}

export class PADEmotionEngine {
  private eventBus: CognitiveEventBus;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  processEmotion(
    npc: NPCCore,
    event: { padDelta: Partial<PADEmotions>; source?: string },
  ): EmotionState {
    const current = npc.emotions.pad;
    const next: PADEmotions = {
      pleasure: clampPad(
        current.pleasure + (event.padDelta.pleasure ?? 0),
      ),
      arousal: clampPad(
        current.arousal + (event.padDelta.arousal ?? 0),
      ),
      dominance: clampPad(
        current.dominance + (event.padDelta.dominance ?? 0),
      ),
    };

    const emotions = computeEmotions(next);
    const mood = computeMood(next);
    const state: EmotionState = { pad: next, emotions, mood };

    npc.emotions = state;

    this.emitChanged(npc.id, state, event.source);
    return state;
  }

  decayEmotion(npc: NPCCore, decayRate: number = 0.05): EmotionState {
    const current = npc.emotions.pad;
    const next: PADEmotions = {
      pleasure: clampPad(current.pleasure * (1 - decayRate)),
      arousal: clampPad(current.arousal * (1 - decayRate)),
      dominance: clampPad(current.dominance * (1 - decayRate)),
    };

    const emotions = computeEmotions(next);
    const mood = computeMood(next);
    const state: EmotionState = { pad: next, emotions, mood };

    npc.emotions = state;

    this.emitChanged(npc.id, state, 'decay');
    return state;
  }

  getEmotionLabel(pad: PADEmotions): {
    emotions: Record<EmotionLabel, number>;
    mood: MoodLabel;
  } {
    return {
      emotions: computeEmotions(pad),
      mood: computeMood(pad),
    };
  }

  private emitChanged(
    npcId: string,
    state: EmotionState,
    source?: string,
  ): void {
    this.eventBus.emit({
      type: 'EMOTION_CHANGED' as CognitiveEventType,
      source: source ?? 'pad-emotion',
      npcId,
      data: { pad: state.pad, emotions: state.emotions, mood: state.mood },
    });
  }
}

export { EMOTION_KEYS };
