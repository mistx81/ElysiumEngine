import type { CognitiveEventBus } from './event-bus';
import type {
  Relationship,
  RelationshipType,
  RelationshipEvent,
  RelationshipMap,
  RelationshipGraphConfig,
  NPCId,
  CognitiveEventType,
} from '../types';

const RIPPLE_DECAY_FACTOR = 0.2;
const MAX_RIPPLE_DEPTH = 3;

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'friend',
  'enemy',
  'family',
  'rival',
  'acquaintance',
  'romantic',
  'mentor',
  'student',
];

function clampTrust(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

function clampAffinity(value: number): number {
  return Math.max(-100, Math.min(100, value));
}

function clampFamiliarity(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function createRelationship(npcId: NPCId, type: RelationshipType): Relationship {
  return {
    npcId,
    type,
    trust: 0,
    affinity: 0,
    familiarity: 0,
    history: [],
  };
}

type GraphStats = {
  totalRelationships: number;
  averageTrust: number;
  averageAffinity: number;
  averageFamiliarity: number;
  byType: Record<RelationshipType, number>;
};

export class RelationshipGraph {
  private eventBus: CognitiveEventBus;
  private config: RelationshipGraphConfig;
  private relationships: Map<NPCId, Map<NPCId, Relationship>> = new Map();
  private idCounter = 0;

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    this.config = {
      rippleDecayFactor: RIPPLE_DECAY_FACTOR,
      maxRippleDepth: MAX_RIPPLE_DEPTH,
    };
  }

  private getInnerMap(npcId: NPCId): Map<NPCId, Relationship> {
    let inner = this.relationships.get(npcId);
    if (!inner) {
      inner = new Map();
      this.relationships.set(npcId, inner);
    }
    return inner;
  }

  addRelationship(
    fromId: NPCId,
    toId: NPCId,
    type: RelationshipType,
    trust = 0,
    affinity = 0,
    familiarity = 0,
  ): Relationship {
    const inner = this.getInnerMap(fromId);
    const rel = createRelationship(toId, type);
    rel.trust = clampTrust(trust);
    rel.affinity = clampAffinity(affinity);
    rel.familiarity = clampFamiliarity(familiarity);
    inner.set(toId, rel);

    this.eventBus.emit({
      type: 'RELATIONSHIP_CHANGED' as CognitiveEventType,
      source: 'relationship-graph',
      npcId: fromId,
      data: {
        action: 'add',
        fromId,
        toId,
        type,
        trust: rel.trust,
        affinity: rel.affinity,
        familiarity: rel.familiarity,
      },
    });

    return rel;
  }

  updateRelationship(
    fromId: NPCId,
    toId: NPCId,
    updates: Partial<Pick<Relationship, 'type' | 'trust' | 'affinity' | 'familiarity'>>,
    eventDescription?: string,
  ): Relationship | null {
    const inner = this.relationships.get(fromId);
    if (!inner) return null;
    const rel = inner.get(toId);
    if (!rel) return null;

    const delta = {
      trust: 0,
      affinity: 0,
      familiarity: 0,
    };

    if (updates.type !== undefined) rel.type = updates.type;
    if (updates.trust !== undefined) {
      const newTrust = clampTrust(updates.trust);
      delta.trust = newTrust - rel.trust;
      rel.trust = newTrust;
    }
    if (updates.affinity !== undefined) {
      const newAffinity = clampAffinity(updates.affinity);
      delta.affinity = newAffinity - rel.affinity;
      rel.affinity = newAffinity;
    }
    if (updates.familiarity !== undefined) {
      const newFamiliarity = clampFamiliarity(updates.familiarity);
      delta.familiarity = newFamiliarity - rel.familiarity;
      rel.familiarity = newFamiliarity;
    }

    const historyEvent: RelationshipEvent = {
      type: updates.type ?? rel.type,
      delta: delta.trust + delta.affinity,
      timestamp: Date.now(),
      description: eventDescription ?? 'relationship updated',
    };
    rel.history.push(historyEvent);

    this.eventBus.emit({
      type: 'RELATIONSHIP_CHANGED' as CognitiveEventType,
      source: 'relationship-graph',
      npcId: fromId,
      data: {
        action: 'update',
        fromId,
        toId,
        updates,
        delta,
      },
    });

    return rel;
  }

  getRelationship(fromId: NPCId, toId: NPCId): Relationship | null {
    const inner = this.relationships.get(fromId);
    if (!inner) return null;
    return inner.get(toId) ?? null;
  }

  getAllRelationships(npcId: NPCId): RelationshipMap {
    const inner = this.relationships.get(npcId);
    const result: RelationshipMap = {};
    if (!inner) return result;
    for (const [toId, rel] of inner) {
      result[toId] = rel;
    }
    return result;
  }

  propagateRipple(
    sourceId: NPCId,
    affectedId: NPCId,
    trustDelta: number,
    depth = 0,
  ): void {
    if (depth >= this.config.maxRippleDepth) return;
    if (trustDelta === 0) return;

    const inner = this.relationships.get(affectedId);
    if (inner) {
      for (const [otherId, rel] of inner) {
        if (otherId === sourceId) continue;
        const rippleAmount = trustDelta * this.config.rippleDecayFactor;
        if (Math.abs(rippleAmount) < 0.1) continue;

        const newTrust = clampTrust(rel.trust + rippleAmount);
        const actualDelta = newTrust - rel.trust;
        rel.trust = newTrust;

        rel.history.push({
          type: rel.type,
          delta: actualDelta,
          timestamp: Date.now(),
          description: `ripple from ${sourceId} via ${affectedId} (depth ${depth})`,
        });

        this.eventBus.emit({
          type: 'RELATIONSHIP_RIPPLE' as CognitiveEventType,
          source: 'relationship-graph',
          npcId: affectedId,
          data: {
            sourceId,
            affectedId,
            rippleTargetId: otherId,
            originalDelta: trustDelta,
            rippleAmount: actualDelta,
            depth,
          },
        });

        this.propagateRipple(affectedId, otherId, rippleAmount, depth + 1);
      }
    }
  }

  getGraphStats(): GraphStats {
    let total = 0;
    let trustSum = 0;
    let affinitySum = 0;
    let familiaritySum = 0;
    const byType: Record<RelationshipType, number> = {
      friend: 0,
      enemy: 0,
      family: 0,
      rival: 0,
      acquaintance: 0,
      romantic: 0,
      mentor: 0,
      student: 0,
    };

    for (const inner of this.relationships.values()) {
      for (const rel of inner.values()) {
        total += 1;
        trustSum += rel.trust;
        affinitySum += rel.affinity;
        familiaritySum += rel.familiarity;
        byType[rel.type] += 1;
      }
    }

    return {
      totalRelationships: total,
      averageTrust: total > 0 ? trustSum / total : 0,
      averageAffinity: total > 0 ? affinitySum / total : 0,
      averageFamiliarity: total > 0 ? familiaritySum / total : 0,
      byType,
    };
  }
}

export { RELATIONSHIP_TYPES, RIPPLE_DECAY_FACTOR, MAX_RIPPLE_DEPTH };
