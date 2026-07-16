import type { CognitiveEventBus } from './event-bus';
import type {
  UtilityAction,
  UtilityDecision,
  UtilityContext,
  NPCCore,
  NeedType,
  NeedState,
  EmotionState,
  PersonalityProfile,
  RelationshipMap,
  CognitiveEventType,
} from '../types';

const CRITICAL_THRESHOLD = 20;
const CRITICAL_BOOST = 1.5;

function buildActionLibrary(): UtilityAction[] {
  return [
    {
      name: 'idle',
      baseScore: 0.3,
      factors: [
        {
          name: 'lowUrgency',
          weight: 0.5,
          getValue: (ctx) => {
            const avgNeed =
              (ctx.needs.hunger + ctx.needs.thirst + ctx.needs.sleep) / 3;
            return Math.max(0, 1 - avgNeed / 100);
          },
        },
      ],
    },
    {
      name: 'seek_food',
      baseScore: 0.5,
      criticalNeed: 'hunger',
      factors: [
        {
          name: 'hungerLevel',
          weight: 1.0,
          getValue: (ctx) => 1 - ctx.needs.hunger / 100,
        },
      ],
    },
    {
      name: 'seek_water',
      baseScore: 0.5,
      criticalNeed: 'thirst',
      factors: [
        {
          name: 'thirstLevel',
          weight: 1.0,
          getValue: (ctx) => 1 - ctx.needs.thirst / 100,
        },
      ],
    },
    {
      name: 'seek_sleep',
      baseScore: 0.4,
      criticalNeed: 'sleep',
      factors: [
        {
          name: 'sleepDeprivation',
          weight: 1.0,
          getValue: (ctx) => 1 - ctx.needs.sleep / 100,
        },
      ],
    },
    {
      name: 'seek_social',
      baseScore: 0.4,
      criticalNeed: 'social',
      factors: [
        {
          name: 'socialNeed',
          weight: 0.8,
          getValue: (ctx) => 1 - ctx.needs.social / 100,
        },
        {
          name: 'extraversion',
          weight: 0.3,
          getValue: (ctx) => ctx.personality.extraversion / 100,
        },
      ],
    },
    {
      name: 'seek_safety',
      baseScore: 0.6,
      criticalNeed: 'safety',
      factors: [
        {
          name: 'safetyNeed',
          weight: 1.0,
          getValue: (ctx) => 1 - ctx.needs.safety / 100,
        },
        {
          name: 'fearLevel',
          weight: 0.5,
          getValue: (ctx) => ctx.emotions.emotions.fear / 100,
        },
      ],
    },
    {
      name: 'work',
      baseScore: 0.4,
      factors: [
        {
          name: 'conscientiousness',
          weight: 0.6,
          getValue: (ctx) => ctx.personality.conscientiousness / 100,
        },
        {
          name: 'esteemNeed',
          weight: 0.4,
          getValue: (ctx) => 1 - ctx.needs.esteem / 100,
        },
      ],
    },
    {
      name: 'explore',
      baseScore: 0.3,
      factors: [
        {
          name: 'openness',
          weight: 0.7,
          getValue: (ctx) => ctx.personality.openness / 100,
        },
        {
          name: 'selfActualization',
          weight: 0.3,
          getValue: (ctx) => 1 - ctx.needs.selfActualization / 100,
        },
      ],
    },
    {
      name: 'trade',
      baseScore: 0.35,
      factors: [
        {
          name: 'extraversion',
          weight: 0.4,
          getValue: (ctx) => ctx.personality.extraversion / 100,
        },
        {
          name: 'conscientiousness',
          weight: 0.3,
          getValue: (ctx) => ctx.personality.conscientiousness / 100,
        },
      ],
    },
    {
      name: 'fight',
      baseScore: 0.2,
      factors: [
        {
          name: 'angerLevel',
          weight: 0.6,
          getValue: (ctx) => ctx.emotions.emotions.anger / 100,
        },
        {
          name: 'lowAgreeableness',
          weight: 0.4,
          getValue: (ctx) => 1 - ctx.personality.agreeableness / 100,
        },
      ],
    },
    {
      name: 'flee',
      baseScore: 0.5,
      factors: [
        {
          name: 'fearLevel',
          weight: 0.8,
          getValue: (ctx) => ctx.emotions.emotions.fear / 100,
        },
        {
          name: 'lowDominance',
          weight: 0.3,
          getValue: (ctx) => 1 - (ctx.emotions.pad.dominance + 1) / 2,
        },
      ],
    },
    {
      name: 'play',
      baseScore: 0.3,
      factors: [
        {
          name: 'joyLevel',
          weight: 0.3,
          getValue: (ctx) => ctx.emotions.emotions.joy / 100,
        },
        {
          name: 'extraversion',
          weight: 0.4,
          getValue: (ctx) => ctx.personality.extraversion / 100,
        },
        {
          name: 'openness',
          weight: 0.2,
          getValue: (ctx) => ctx.personality.openness / 100,
        },
      ],
    },
  ];
}

function buildContext(npc: NPCCore): UtilityContext {
  return {
    needs: npc.needs,
    emotions: npc.emotions,
    personality: npc.personality,
    relationships: npc.relationships ?? {},
    timeOfDay: 12,
  };
}

function isCritical(need: number): boolean {
  return need < CRITICAL_THRESHOLD;
}

export class UtilityAIEngine {
  private eventBus: CognitiveEventBus;
  private actions: UtilityAction[];

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.actions = buildActionLibrary();
  }

  scoreActions(npc: NPCCore): UtilityDecision {
    const ctx = buildContext(npc);
    let bestAction = '';
    let bestScore = -Infinity;
    let bestFactors: Record<string, number> = {};
    let isCriticalOverride = false;

    for (const action of this.actions) {
      let score = action.baseScore;
      const factors: Record<string, number> = {};

      for (const factor of action.factors) {
        const value = factor.getValue(ctx);
        factors[factor.name] = value;
        score += value * factor.weight;
      }

      let actionCritical = false;
      if (action.criticalNeed) {
        const needValue = ctx.needs[action.criticalNeed];
        if (isCritical(needValue)) {
          score *= CRITICAL_BOOST;
          actionCritical = true;
        }
      }

      score = Math.max(0, Math.min(1, score));

      if (actionCritical && score > bestScore * 0.8) {
        isCriticalOverride = true;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAction = action.name;
        bestFactors = factors;
        if (actionCritical) {
          isCriticalOverride = true;
        } else if (!actionCritical && bestScore === score) {
          // keep existing override flag only if this non-critical beat a critical
        }
      }
    }

    if (bestScore === -Infinity) {
      bestAction = 'idle';
      bestScore = 0.3;
    }

    const decision: UtilityDecision = {
      action: bestAction,
      score: bestScore,
      factors: bestFactors,
      timestamp: Date.now(),
      isCriticalOverride,
    };

    this.eventBus.emit({
      type: 'UTILITY_SCORED' as CognitiveEventType,
      source: 'utility-ai',
      npcId: npc.id,
      data: { action: bestAction, score: bestScore, factors: bestFactors },
    });

    this.eventBus.emit({
      type: 'DECISION_MADE' as CognitiveEventType,
      source: 'utility-ai',
      npcId: npc.id,
      data: decision,
    });

    if (npc.decisionHistory) {
      npc.decisionHistory.push(decision);
    } else {
      npc.decisionHistory = [decision];
    }

    return decision;
  }

  getTopActions(npc: NPCCore, n: number): UtilityDecision[] {
    const ctx = buildContext(npc);
    const decisions: UtilityDecision[] = [];

    for (const action of this.actions) {
      let score = action.baseScore;
      const factors: Record<string, number> = {};

      for (const factor of action.factors) {
        const value = factor.getValue(ctx);
        factors[factor.name] = value;
        score += value * factor.weight;
      }

      let isCriticalOverride = false;
      if (action.criticalNeed) {
        const needValue = ctx.needs[action.criticalNeed];
        if (isCritical(needValue)) {
          score *= CRITICAL_BOOST;
          isCriticalOverride = true;
        }
      }

      score = Math.max(0, Math.min(1, score));

      decisions.push({
        action: action.name,
        score,
        factors,
        timestamp: Date.now(),
        isCriticalOverride,
      });
    }

    decisions.sort((a, b) => b.score - a.score);
    return decisions.slice(0, n);
  }

  getActionScores(npc: NPCCore): Record<string, number> {
    const ctx = buildContext(npc);
    const scores: Record<string, number> = {};

    for (const action of this.actions) {
      let score = action.baseScore;

      for (const factor of action.factors) {
        const value = factor.getValue(ctx);
        score += value * factor.weight;
      }

      if (action.criticalNeed) {
        const needValue = ctx.needs[action.criticalNeed];
        if (isCritical(needValue)) {
          score *= CRITICAL_BOOST;
        }
      }

      scores[action.name] = Math.max(0, Math.min(1, score));
    }

    return scores;
  }
}

export {
  CRITICAL_THRESHOLD,
  CRITICAL_BOOST,
  buildActionLibrary as buildUtilityActionLibrary,
};
