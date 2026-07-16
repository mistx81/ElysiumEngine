import type { CognitiveEventBus } from './event-bus';
import type {
  Reflection,
  NPCCore,
  NPCId,
  CognitiveEventType,
} from '../types';

type ReflectionTrigger =
  | 'high_emotion'
  | 'relationship_change'
  | 'goal_outcome'
  | 'memory_consolidation';

type NPCReflectionData = {
  reflections: Reflection[];
};

const EMOTION_THRESHOLD = 0.7;
const RECENT_LIMIT = 10;

function dominantEmotionValue(npc: NPCCore): number {
  const emotions = npc.emotions.emotions;
  let max = 0;
  for (const key of Object.keys(emotions) as (keyof typeof emotions)[]) {
    const v = emotions[key];
    if (v > max) max = v;
  }
  return max;
}

function buildInsights(npc: NPCCore, trigger: ReflectionTrigger): string[] {
  const insights: string[] = [];
  const topEmotion = dominantEmotionValue(npc);

  if (trigger === 'high_emotion') {
    insights.push(
      `Experienced intense emotion (intensity ${topEmotion.toFixed(2)}); considering emotional regulation.`,
    );
  }
  if (trigger === 'relationship_change') {
    const relCount = Object.keys(npc.relationships).length;
    insights.push(
      `Relationship network shifted (${relCount} active ties); re-evaluating social strategy.`,
    );
  }
  if (trigger === 'goal_outcome') {
    if (npc.currentGoal === null) {
      insights.push('Recent goal resolved; seeking new objectives.');
    } else {
      insights.push(`Pursuing goal "${npc.currentGoal.name}" with renewed focus.`);
    }
  }
  if (trigger === 'memory_consolidation') {
    const longTermCount = npc.memories.long.length;
    insights.push(`Consolidated ${longTermCount} long-term memories into worldview.`);
  }

  const neuroticism = npc.personality.neuroticism;
  if (neuroticism > 60 && topEmotion > EMOTION_THRESHOLD) {
    insights.push('High neuroticism amplifying emotional response; practicing self-soothing.');
  }

  return insights;
}

function computeEmotionalImpact(npc: NPCCore, trigger: ReflectionTrigger): number {
  const emotionVal = dominantEmotionValue(npc);
  let impact = emotionVal;
  if (trigger === 'relationship_change') impact *= 0.8;
  if (trigger === 'goal_outcome') impact *= 0.6;
  if (trigger === 'memory_consolidation') impact *= 0.4;
  return Math.min(1, impact);
}

function gatherRelatedMemories(npc: NPCCore): string[] {
  const recent = npc.memories.short.slice(-3).map((m) => m.id);
  const long = npc.memories.long.slice(-2).map((m) => m.id);
  return [...recent, ...long];
}

export class ReflectionSystem {
  private eventBus: CognitiveEventBus;
  private npcData: Map<NPCId, NPCReflectionData> = new Map();
  private idCounter = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
  }

  private getData(npcId: NPCId): NPCReflectionData {
    let data = this.npcData.get(npcId);
    if (!data) {
      data = { reflections: [] };
      this.npcData.set(npcId, data);
    }
    return data;
  }

  private determineTrigger(npc: NPCCore): ReflectionTrigger {
    const topEmotion = dominantEmotionValue(npc);
    if (topEmotion >= EMOTION_THRESHOLD) return 'high_emotion';

    const relMapSize = Object.keys(npc.relationships).length;
    if (relMapSize > 0) return 'relationship_change';

    if (npc.currentGoal === null) return 'goal_outcome';

    return 'memory_consolidation';
  }

  triggerReflection(npc: NPCCore): Reflection {
    const data = this.getData(npc.id);
    const trigger = this.determineTrigger(npc);
    const now = Date.now();

    this.eventBus.emit({
      type: 'REFLECTION_STARTED' as CognitiveEventType,
      source: 'reflection-system',
      npcId: npc.id,
      data: { trigger },
    });

    const insights = buildInsights(npc, trigger);
    const emotionalImpact = computeEmotionalImpact(npc, trigger);
    const relatedMemories = gatherRelatedMemories(npc);

    const reflection: Reflection = {
      id: `ref_${now}_${++this.idCounter}`,
      npcId: npc.id,
      timestamp: now,
      trigger,
      insights,
      emotionalImpact,
      relatedMemories,
    };

    data.reflections.push(reflection);

    if (insights.length > 0) {
      npc.thoughtHistory.push(insights[0]);
    }

    this.eventBus.emit({
      type: 'REFLECTION_COMPLETED' as CognitiveEventType,
      source: 'reflection-system',
      npcId: npc.id,
      data: {
        reflectionId: reflection.id,
        trigger,
        insightCount: insights.length,
        emotionalImpact,
      },
    });

    return reflection;
  }

  getReflections(npcId: NPCId): Reflection[] {
    const data = this.npcData.get(npcId);
    return data ? [...data.reflections] : [];
  }

  getRecentReflections(npcId: NPCId, limit = RECENT_LIMIT): Reflection[] {
    const data = this.npcData.get(npcId);
    if (!data) return [];
    return data.reflections.slice(-limit);
  }
}

export { EMOTION_THRESHOLD as REFLECTION_EMOTION_THRESHOLD, RECENT_LIMIT as REFLECTION_RECENT_LIMIT };
export type { ReflectionTrigger };
