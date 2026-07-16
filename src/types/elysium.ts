// ===========================================
// ELYSIUM ENGINE - ARTIFICIAL CONSCIOUSNESS
// Phase Two: Cognitive Core
// ===========================================

// Emotional Dimensions (12-axis system)
export type EmotionType =
  | 'trust'
  | 'fear'
  | 'respect'
  | 'love'
  | 'anger'
  | 'greed'
  | 'honor'
  | 'stress'
  | 'hope'
  | 'curiosity'
  | 'jealousy'
  | 'loyalty';

// Memory Types
export type MemoryType =
  | 'short_term'
  | 'long_term'
  | 'episodic'
  | 'semantic'
  | 'emotional'
  | 'relationship';

// Goal Types
export type GoalType =
  | 'current'
  | 'hidden'
  | 'life'
  | 'dream'
  | 'fear'
  | 'secret';

// Relationship Types
export type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'family'
  | 'romantic'
  | 'professional'
  | 'acquaintance'
  | 'rival'
  | 'mentor'
  | 'mentee'
  | 'neutral';

// Memory Source
export type MemorySource =
  | 'observation'
  | 'interaction'
  | 'rumor'
  | 'derivation'
  | 'event';

// Thought Types
export type ThoughtSource = 'internal' | 'observation' | 'derivation' | 'goal' | 'emotion';

// Knowledge Source Types
export type KnowledgeSourceType =
  | 'observation'
  | 'hearsay'
  | 'rumor'
  | 'witness'
  | 'documentation'
  | 'derivation';

// Decision Source Types
export type DecisionSourceType =
  | 'interaction'
  | 'observation'
  | 'rumor'
  | 'decay'
  | 'event'
  | 'internal';

// ===========================================
// PHASE 2: COGNITIVE TYPES
// ===========================================

export interface Thought {
  id: string;
  npcId: string;
  text: string;
  priority: number;
  confidence: number;
  reason: string | null;
  linkedMemoryIds: string[];
  linkedGoalIds: string[];
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface EmotionHistory {
  id: string;
  npcId: string;
  emotionType: EmotionType;
  targetId: string;
  oldValue: number;
  newValue: number;
  delta: number;
  reason: string | null;
  sourceType: DecisionSourceType;
  sourceId: string | null;
  createdAt: Date;
}

export interface Knowledge {
  id: string;
  npcId: string;
  fact: string;
  source: string;
  sourceType: KnowledgeSourceType;
  confidence: number;
  importance: number;
  lastVerified: Date;
  isVerified: boolean;
  relatedEntities: string[];
  tags: string[];
  createdAt: Date;
}

export interface Decision {
  id: string;
  npcId: string;
  triggerEvent: string;
  retrievedMemories: string[];
  emotionState: Record<string, number>;
  relevantGoals: string[];
  personalityModifiers: Record<string, number>;
  reasoning: string | null;
  finalDecision: string;
  generatedDialogue: string | null;
  confidence: number;
  createdAt: Date;
}

export interface WorldEvent {
  id: string;
  eventType: string;
  title: string;
  description: string;
  location: string | null;
  involvedNpcs: string[];
  impact: Record<string, unknown>;
  isPublic: boolean;
  occurredAt: Date;
  createdAt: Date;
}

export interface Rumor {
  id: string;
  npcId: string;
  content: string;
  sourceNpcId: string | null;
  originalEventId: string | null;
  distortionLevel: number;
  spreadCount: number;
  isBelieved: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

// ===========================================
// BASE TYPES
// ===========================================

export interface PersonalityTraits {
  honesty: number;
  bravery: number;
  humor: number;
  greed: number;
  mercy: number;
  curiosity: number;
  intelligence: number;
  charisma: number;
  patience: number;
  loyalty: number;
  ambition: number;
  caution: number;
}

export interface Emotion {
  id: string;
  type: EmotionType;
  targetId: string;
  value: number;
  volatility: number;
}

export interface Memory {
  id: string;
  npcId: string;
  type: MemoryType;
  title: string;
  content: string;
  importance: number;
  confidence: number;
  emotionalValence: number;
  decayRate: number;
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  sourceType: MemorySource;
  relatedEntityId: string | null;
  createdAt: Date;
}

export interface Goal {
  id: string;
  npcId: string;
  type: GoalType;
  title: string;
  description: string;
  priority: number;
  progress: number;
  isCompleted: boolean;
  deadline: Date | null;
  dependsOn: string[];
}

export interface Relationship {
  id: string;
  sourceNpcId: string;
  targetType: 'player' | 'npc';
  targetNpcId: string | null;
  relationshipType: RelationshipType;
  strength: number;
  trust: number;
  interactionCount: number;
  lastInteraction: Date;
}

export interface NPC {
  id: string;
  name: string;
  background: string;
  personalityDescription: string;
  personalityTraits: PersonalityTraits;
  totalAffinity: number;
  currentMood: string;
  emotions: Emotion[];
  memories: Memory[];
  goals: Goal[];
  relationships: Relationship[];
  thoughts: Thought[];
  knowledge: Knowledge[];
  decisions: Decision[];
  emotionHistory: EmotionHistory[];
  playerRelationship: Relationship | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// INTERACTION TEMPLATES
// ===========================================

export interface InteractionTemplate {
  label: string;
  category: string;
  emotionImpacts: {
    type: EmotionType;
    delta: number;
  }[];
  memoryContent: string;
  memoryType: MemoryType;
  importance: number;
  icon: string;
}

export const INTERACTION_TEMPLATES: InteractionTemplate[] = [
  {
    label: 'Generous Gift',
    category: 'positive',
    emotionImpacts: [
      { type: 'trust', delta: 20 },
      { type: 'greed', delta: 15 },
    ],
    memoryContent: 'Player gave me a generous gift when I was in need.',
    memoryType: 'emotional',
    importance: 0.7,
    icon: 'Gift',
  },
  {
    label: 'Saved My Life',
    category: 'heroic',
    emotionImpacts: [
      { type: 'trust', delta: 40 },
      { type: 'loyalty', delta: 35 },
      { type: 'love', delta: 25 },
    ],
    memoryContent: 'Player risked their life to save me from certain death.',
    memoryType: 'episodic',
    importance: 1.0,
    icon: 'Heart',
  },
  {
    label: 'Kept a Promise',
    category: 'positive',
    emotionImpacts: [
      { type: 'trust', delta: 25 },
      { type: 'respect', delta: 20 },
    ],
    memoryContent: 'Player honored their word and kept their promise.',
    memoryType: 'long_term',
    importance: 0.8,
    icon: 'CheckCircle',
  },
  {
    label: 'Shared Secret',
    category: 'social',
    emotionImpacts: [
      { type: 'trust', delta: 20 },
      { type: 'curiosity', delta: 10 },
    ],
    memoryContent: 'Player trusted me with sensitive information.',
    memoryType: 'relationship',
    importance: 0.6,
    icon: 'Key',
  },
  {
    label: 'Defended My Honor',
    category: 'positive',
    emotionImpacts: [
      { type: 'respect', delta: 25 },
      { type: 'loyalty', delta: 20 },
      { type: 'honor', delta: 30 },
    ],
    memoryContent: 'Player stood up for me when others spoke ill.',
    memoryType: 'emotional',
    importance: 0.7,
    icon: 'Shield',
  },
  {
    label: 'Broke Promise',
    category: 'negative',
    emotionImpacts: [
      { type: 'trust', delta: -30 },
      { type: 'anger', delta: 25 },
    ],
    memoryContent: 'Player broke their promise to me after I trusted them.',
    memoryType: 'long_term',
    importance: 0.8,
    icon: 'XCircle',
  },
  {
    label: 'Betrayal',
    category: 'betrayal',
    emotionImpacts: [
      { type: 'trust', delta: -50 },
      { type: 'anger', delta: 45 },
      { type: 'fear', delta: 20 },
    ],
    memoryContent: 'Player betrayed my trust and used my secrets against me.',
    memoryType: 'episodic',
    importance: 1.0,
    icon: 'AlertTriangle',
  },
  {
    label: 'Attacked Me',
    category: 'combat',
    emotionImpacts: [
      { type: 'fear', delta: 40 },
      { type: 'anger', delta: 50 },
      { type: 'trust', delta: -40 },
    ],
    memoryContent: 'Player attacked me without provocation.',
    memoryType: 'episodic',
    importance: 1.0,
    icon: 'Swords',
  },
  {
    label: 'Stole From Me',
    category: 'betrayal',
    emotionImpacts: [
      { type: 'anger', delta: 35 },
      { type: 'greed', delta: -10 },
      { type: 'trust', delta: -35 },
    ],
    memoryContent: 'Player stole something precious from me.',
    memoryType: 'episodic',
    importance: 0.9,
    icon: 'Eye',
  },
  {
    label: 'Showed Mercy',
    category: 'positive',
    emotionImpacts: [
      { type: 'respect', delta: 20 },
      { type: 'hope', delta: 25 },
      { type: 'trust', delta: 15 },
    ],
    memoryContent: 'Player showed mercy when they could have ended me.',
    memoryType: 'emotional',
    importance: 0.8,
    icon: 'Heart',
  },
  {
    label: 'Romantic Gesture',
    category: 'romantic',
    emotionImpacts: [
      { type: 'love', delta: 30 },
      { type: 'trust', delta: 15 },
      { type: 'hope', delta: 20 },
    ],
    memoryContent: 'Player showed romantic interest in me.',
    memoryType: 'emotional',
    importance: 0.8,
    icon: 'Heart',
  },
  {
    label: 'Spread Rumor',
    category: 'negative',
    emotionImpacts: [
      { type: 'anger', delta: 30 },
      { type: 'stress', delta: 25 },
      { type: 'trust', delta: -25 },
    ],
    memoryContent: 'Player spread harmful rumors about me.',
    memoryType: 'relationship',
    importance: 0.7,
    icon: 'MessageCircle',
  },
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

export function getMoodFromEmotions(emotions: Emotion[]): string {
  const playerEmotions = emotions.filter(e => e.targetId === 'player');
  if (playerEmotions.length === 0) return 'neutral';

  const trust = playerEmotions.find(e => e.type === 'trust')?.value || 0;
  const fear = playerEmotions.find(e => e.type === 'fear')?.value || 0;
  const love = playerEmotions.find(e => e.type === 'love')?.value || 0;
  const anger = playerEmotions.find(e => e.type === 'anger')?.value || 0;
  const loyalty = playerEmotions.find(e => e.type === 'loyalty')?.value || 0;

  if (love > 50 && trust > 40) return 'devoted';
  if (loyalty > 30 && trust > 20) return 'friendly';
  if (anger > 50 || fear > 50) return 'hostile';
  if (anger > 30 || fear > 30) return 'suspicious';
  if (trust < -30) return 'nemesis';

  return 'neutral';
}

export function calculateTotalAffinity(emotions: Emotion[]): number {
  const playerEmotions = emotions.filter(e => e.targetId === 'player');
  if (playerEmotions.length === 0) return 0;

  const weights: Record<EmotionType, number> = {
    trust: 1.5,
    fear: -1.2,
    respect: 0.8,
    love: 2.0,
    anger: -1.5,
    greed: 0.3,
    honor: 0.7,
    stress: -0.5,
    hope: 0.8,
    curiosity: 0.4,
    jealousy: -0.6,
    loyalty: 1.0,
  };

  let total = 0;
  for (const emotion of playerEmotions) {
    total += emotion.value * weights[emotion.type];
  }

  return Math.round(Math.max(-100, Math.min(100, total)));
}

export function generateAIPromptContext(npc: NPC): string {
  const playerEmotions = npc.emotions.filter(e => e.targetId === 'player');

  let prompt = `You are ${npc.name}. `
  prompt += `\nPersonality: ${npc.personalityDescription}`
  prompt += `\nBackground: ${npc.background}`

  prompt += "\n\nYour Emotional State Toward the Player:\n"
  if (playerEmotions.length === 0) {
    prompt += 'You have no strong feelings yet.\n'
  } else {
    for (const emotion of playerEmotions) {
      const absValue = Math.abs(emotion.value)
      const intensity = absValue > 70 ? 'very strong' : absValue > 40 ? 'moderate' : 'slight'
      prompt += `- ${emotion.type}: ${intensity} (${emotion.value > 0 ? '+' : ''}${emotion.value})\n`
    }
  }

  prompt += '\nPersonality Traits:\n'
  const traits = npc.personalityTraits
  prompt += `- Honesty: ${traits.honesty}/100\n`
  prompt += `- Bravery: ${traits.bravery}/100\n`
  prompt += `- Intelligence: ${traits.intelligence}/100\n`
  prompt += `- Loyalty: ${traits.loyalty}/100\n`

  const activeThoughts = npc.thoughts.filter(t => t.isActive).slice(0, 3)
  if (activeThoughts.length > 0) {
    prompt += '\nCurrent Thoughts:\n'
    for (const thought of activeThoughts) {
      prompt += `- ${thought.text}\n`
    }
  }

  const activeGoals = npc.goals.filter(g => !g.isCompleted && g.type === 'current').slice(-2)
  if (activeGoals.length > 0) {
    prompt += '\nCurrent Goals:\n'
    for (const goal of activeGoals) {
      prompt += `- ${goal.title} (${Math.round(goal.progress * 100)}% complete)\n`
    }
  }

  const recentMemories = npc.memories
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)

  if (recentMemories.length > 0) {
    prompt += '\nRelevant Memories:\n'
    for (const memory of recentMemories) {
      prompt += `- [${memory.type}] ${memory.content}\n`
    }
  } else {
    prompt += '\nYou have no recent memories of the player.\n'
  }

  return prompt
}

export const DEFAULT_PERSONALITY: PersonalityTraits = {
  honesty: 50,
  bravery: 50,
  humor: 50,
  greed: 50,
  mercy: 50,
  curiosity: 50,
  intelligence: 50,
  charisma: 50,
  patience: 50,
  loyalty: 50,
  ambition: 50,
  caution: 50,
}
