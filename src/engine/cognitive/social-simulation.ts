import type { CognitiveEventBus } from './event-bus';
import type {
  SocialInteraction,
  SocialInteractionType,
  Faction,
  FactionId,
  GossipItem,
  NPCId,
  CognitiveEventType,
} from '../types';

const GOSSIP_DECAY_RATE = 0.05;
const MAX_GOSSIP_ITEMS = 100;
const MAX_REPUTATION = 100;

const INTERACTION_TYPES: SocialInteractionType[] = [
  'conversation',
  'trade',
  'argument',
  'cooperation',
  'greeting',
  'farewell',
  'compliment',
  'insult',
  'gossip',
  'threat',
];

const DEFAULT_FACTIONS: Faction[] = [
  {
    id: 'merchants',
    name: 'Merchants Guild',
    memberIds: [],
    reputation: 50,
    relationships: {},
  },
  {
    id: 'scholars',
    name: 'Scholarly Order',
    memberIds: [],
    reputation: 50,
    relationships: {},
  },
  {
    id: 'guards',
    name: 'City Guard',
    memberIds: [],
    reputation: 50,
    relationships: {},
  },
  {
    id: 'artisans',
    name: 'Artisans Collective',
    memberIds: [],
    reputation: 50,
    relationships: {},
  },
  {
    id: 'outcasts',
    name: 'Outcast Syndicate',
    memberIds: [],
    reputation: 30,
    relationships: {},
  },
];

const POSITIVE_INTERACTIONS: SocialInteractionType[] = [
  'conversation',
  'cooperation',
  'greeting',
  'compliment',
  'trade',
];

const NEGATIVE_INTERACTIONS: SocialInteractionType[] = [
  'argument',
  'insult',
  'threat',
];

function clampReputation(value: number): number {
  return Math.max(-MAX_REPUTATION, Math.min(MAX_REPUTATION, value));
}

function determineOutcome(
  type: SocialInteractionType,
): 'positive' | 'neutral' | 'negative' {
  if (POSITIVE_INTERACTIONS.includes(type)) return 'positive';
  if (NEGATIVE_INTERACTIONS.includes(type)) return 'negative';
  return 'neutral';
}

function computeTrustDelta(
  type: SocialInteractionType,
  outcome: 'positive' | 'neutral' | 'negative',
): number {
  if (outcome === 'positive') {
    switch (type) {
      case 'compliment': return 5;
      case 'cooperation': return 8;
      case 'trade': return 3;
      case 'greeting': return 1;
      default: return 2;
    }
  }
  if (outcome === 'negative') {
    switch (type) {
      case 'insult': return -5;
      case 'threat': return -10;
      case 'argument': return -4;
      default: return -2;
    }
  }
  return 0;
}

let interactionIdCounter = 0;
let gossipIdCounter = 0;

function generateInteractionId(): string {
  interactionIdCounter += 1;
  return `social_${Date.now()}_${interactionIdCounter}`;
}

function generateGossipId(): string {
  gossipIdCounter += 1;
  return `gossip_${Date.now()}_${gossipIdCounter}`;
}

export class SocialSimulation {
  private eventBus: CognitiveEventBus;
  private factions: Map<FactionId, Faction> = new Map();
  private npcReputation: Map<NPCId, Record<FactionId, number>> = new Map();
  private gossip: GossipItem[] = [];

  constructor(eventBus: CognitiveEventBus) {
    this.eventBus = eventBus;
    for (const faction of DEFAULT_FACTIONS) {
      this.factions.set(faction.id, { ...faction, memberIds: [...faction.memberIds] });
    }
  }

  initiateInteraction(
    initiatorId: NPCId,
    targetId: NPCId,
    type: SocialInteractionType,
  ): SocialInteraction {
    const outcome = determineOutcome(type);
    const trustDelta = computeTrustDelta(type, outcome);
    const now = Date.now();

    const interaction: SocialInteraction = {
      id: generateInteractionId(),
      type,
      initiatorId,
      targetId,
      timestamp: now,
      outcome,
      trustDelta,
      description: `${initiatorId} ${type} with ${targetId}`,
    };

    this.eventBus.emit({
      type: 'SOCIAL_INTERACTION' as CognitiveEventType,
      source: 'social-simulation',
      npcId: initiatorId,
      data: {
        interactionId: interaction.id,
        type,
        initiatorId,
        targetId,
        outcome,
        trustDelta,
      },
    });

    return interaction;
  }

  spreadGossip(
    originatorId: NPCId,
    aboutNPCId: NPCId,
    topic: string,
    truth: number,
    targets: NPCId[],
  ): GossipItem {
    const gossip: GossipItem = {
      id: generateGossipId(),
      topic,
      aboutNPCId,
      originatorId,
      spreadTo: [...targets],
      truth: Math.max(0, Math.min(1, truth)),
      timestamp: Date.now(),
      decayRate: GOSSIP_DECAY_RATE,
    };

    this.gossip.push(gossip);
    if (this.gossip.length > MAX_GOSSIP_ITEMS) {
      this.gossip.shift();
    }

    this.eventBus.emit({
      type: 'SOCIAL_GOSSIP_SPREAD' as CognitiveEventType,
      source: 'social-simulation',
      npcId: originatorId,
      data: {
        gossipId: gossip.id,
        aboutNPCId,
        topic,
        truth: gossip.truth,
        spreadTo: targets,
      },
    });

    return gossip;
  }

  updateGossip(): void {
    const stillActive: GossipItem[] = [];
    for (const g of this.gossip) {
      g.truth = Math.max(0, g.truth - g.decayRate);
      if (g.truth > 0.01) {
        stillActive.push(g);
      }
    }
    this.gossip = stillActive;
  }

  getFactionReputation(npcId: NPCId, factionId: FactionId): number {
    const rep = this.npcReputation.get(npcId);
    if (!rep) return 0;
    return rep[factionId] ?? 0;
  }

  setFactionReputation(npcId: NPCId, factionId: FactionId, reputation: number): void {
    const clamped = clampReputation(reputation);
    let rep = this.npcReputation.get(npcId);
    if (!rep) {
      rep = {};
      this.npcReputation.set(npcId, rep);
    }
    rep[factionId] = clamped;

    this.eventBus.emit({
      type: 'SOCIAL_REPUTATION_CHANGED' as CognitiveEventType,
      source: 'social-simulation',
      npcId,
      data: {
        factionId,
        reputation: clamped,
      },
    });
  }

  getActiveGossip(): GossipItem[] {
    return [...this.gossip];
  }

  getFactions(): Faction[] {
    return [...this.factions.values()];
  }
}

export {
  INTERACTION_TYPES as SOCIAL_INTERACTION_TYPES,
  DEFAULT_FACTIONS as SOCIAL_DEFAULT_FACTIONS,
  GOSSIP_DECAY_RATE as SOCIAL_GOSSIP_DECAY_RATE,
  MAX_GOSSIP_ITEMS as SOCIAL_MAX_GOSSIP_ITEMS,
  MAX_REPUTATION as SOCIAL_MAX_REPUTATION,
};
