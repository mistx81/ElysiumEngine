export type NPCId = string;
export type Vec2 = { x: number; y: number };

export type CognitiveEventType =
  | 'EMOTION_CHANGED'
  | 'MEMORY_FORMED'
  | 'MEMORY_CONSOLIDATED'
  | 'MEMORY_DECAYED'
  | 'MEMORY_RECALLED'
  | 'NEED_CHANGED'
  | 'GOAL_COMPLETED'
  | 'GOAL_FAILED'
  | 'STATE_CHANGED'
  | 'GOAP_PLAN_REQUESTED'
  | 'GOAP_PLAN_FOUND'
  | 'GOAP_PLAN_FAILED'
  | 'GOAP_PLAN_CACHED'
  | 'GOAP_PLAN_REPAIRED'
  | 'UTILITY_SCORED'
  | 'DECISION_MADE'
  | 'PREDICTION_MADE'
  | 'PREDICTION_VERIFIED'
  | 'PERSONALITY_DRIFTED'
  | 'RELATIONSHIP_CHANGED'
  | 'RELATIONSHIP_RIPPLE'
  | 'REFLECTION_STARTED'
  | 'REFLECTION_COMPLETED'
  | 'EPISODIC_ADDED'
  | 'EPISODIC_RECALLED'
  | 'ECONOMY_TRANSACTION'
  | 'ECONOMY_PRICE_UPDATE'
  | 'SCHEDULE_TICK'
  | 'SCHEDULE_TASK_STARTED'
  | 'SCHEDULE_TASK_COMPLETED'
  | 'SOCIAL_INTERACTION'
  | 'SOCIAL_REPUTATION_CHANGED'
  | 'SOCIAL_GOSSIP_SPREAD'
  | 'WORLD_EVENT'
  | 'WORLD_FACT_LEARNED'
  | 'WORLD_TIME_CHANGED'
  | 'WORLD_WEATHER_CHANGED'
  | 'BACKGROUND_TICK'
  | 'BACKGROUND_PHASE_COMPLETED'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'CACHE_EVICTED'
  | 'BATCH_WRITE_FLUSHED'
  | 'PERSISTENCE_CHECKPOINT'
  | 'PERSISTENCE_DIRTY'
  | 'PERSISTENCE_SAVED'
  | 'LOD_CHANGED'
  | 'CHUNK_LOADED'
  | 'CHUNK_UNLOADED'
  | 'CHUNK_TICK'
  | 'SCHEDULE_TASK_QUEUED'
  | 'SCHEDULE_TASK_EXECUTED'
  | 'SCHEDULE_BUDGET_EXCEEDED'
  | 'PLUGIN_LOADED'
  | 'PLUGIN_UNLOADED'
  | 'PLUGIN_ERROR'
  | 'API_CALLED'
  | 'DEBUG_PANEL_REGISTERED'
  | 'DEBUG_PANEL_UNREGISTERED'
  | 'BENCHMARK_COMPLETED';

export type CognitiveEvent = {
  id: string;
  type: CognitiveEventType;
  timestamp: number;
  source: string;
  npcId?: NPCId;
  data?: any;
};

export type PADEmotions = { pleasure: number; arousal: number; dominance: number };
export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'surprise';
export type MoodLabel =
  | 'euphoric'
  | 'happy'
  | 'content'
  | 'calm'
  | 'neutral'
  | 'bored'
  | 'sad'
  | 'anxious'
  | 'angry';
export type EmotionState = {
  pad: PADEmotions;
  emotions: Record<EmotionLabel, number>;
  mood: MoodLabel;
};

export type BigFiveTrait =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism';
export type PersonalityProfile = Record<BigFiveTrait, number>;
export type PersonalityDriftEvent = {
  trait: BigFiveTrait;
  delta: number;
  reason: string;
  timestamp: number;
};

export type MemoryType =
  | 'working'
  | 'short'
  | 'long'
  | 'semantic'
  | 'procedural'
  | 'flashbulb'
  | 'trauma';
export type MemoryRecord = {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: number;
  importance: number;
  emotionalWeight: number;
  decayRate: number;
  lastAccessed: number;
  accessCount: number;
  relatedNPCs: NPCId[];
  relatedEmotions: EmotionLabel[];
  consolidationTarget?: MemoryType;
};
export type MemorySystem = Record<MemoryType, MemoryRecord[]>;

export type NeedType =
  | 'hunger'
  | 'thirst'
  | 'sleep'
  | 'social'
  | 'safety'
  | 'esteem'
  | 'selfActualization';
export type NeedState = Record<NeedType, number>;

export type GOAPWorldState = Record<string, boolean | number | string>;
export type GOAPAction = {
  name: string;
  cost: number;
  preconditions: Record<string, any>;
  effects: Record<string, any>;
  target?: NPCId;
};
export type GOAPGoal = {
  name: string;
  priority: number;
  targetState: Record<string, any>;
};
export type GOAPPlan = {
  goal: GOAPGoal;
  actions: GOAPAction[];
  totalCost: number;
  found: boolean;
  cached: boolean;
};
export type GOAPPlannerConfig = {
  maxDepth: number;
  maxIterations: number;
  maxCacheSize: number;
};

export type UtilityFactor = {
  name: string;
  weight: number;
  getValue: (ctx: UtilityContext) => number;
};
export type UtilityContext = {
  needs: NeedState;
  emotions: EmotionState;
  personality: PersonalityProfile;
  relationships: RelationshipMap;
  timeOfDay: number;
};
export type UtilityAction = {
  name: string;
  baseScore: number;
  factors: UtilityFactor[];
  criticalNeed?: NeedType;
};
export type UtilityDecision = {
  action: string;
  score: number;
  factors: Record<string, number>;
  timestamp: number;
  isCriticalOverride: boolean;
};

export type Prediction = {
  id: string;
  npcId: NPCId;
  predictedAction: string;
  confidence: number;
  timestamp: number;
  verified: boolean;
  actualAction?: string;
};
export type PredictionEngineConfig = {
  historyWindow: number;
  minConfidence: number;
};

export type RelationshipType =
  | 'friend'
  | 'enemy'
  | 'family'
  | 'rival'
  | 'acquaintance'
  | 'romantic'
  | 'mentor'
  | 'student';
export type RelationshipEvent = {
  type: string;
  delta: number;
  timestamp: number;
  description: string;
};
export type Relationship = {
  npcId: NPCId;
  type: RelationshipType;
  trust: number;
  affinity: number;
  familiarity: number;
  history: RelationshipEvent[];
};
export type RelationshipMap = Record<NPCId, Relationship>;
export type RelationshipGraphConfig = {
  rippleDecayFactor: number;
  maxRippleDepth: number;
};

export type EpisodicEvent = {
  id: string;
  npcId: NPCId;
  timestamp: number;
  type: string;
  description: string;
  emotionalValence: number;
  participants: NPCId[];
  location: string;
};

export type Reflection = {
  id: string;
  npcId: NPCId;
  timestamp: number;
  trigger: string;
  insights: string[];
  emotionalImpact: number;
  relatedMemories: string[];
};

export type EconomyItemType =
  | 'food'
  | 'water'
  | 'weapon'
  | 'tool'
  | 'medicine'
  | 'clothing'
  | 'luxury'
  | 'material'
  | 'book';
export type EconomyItem = {
  type: EconomyItemType;
  basePrice: number;
  currentPrice: number;
  supply: number;
  demand: number;
  priceHistory: number[];
};
export type EconomyTransaction = {
  id: string;
  buyerId: NPCId;
  sellerId: NPCId | 'world';
  itemType: EconomyItemType;
  quantity: number;
  totalPrice: number;
  timestamp: number;
};
export type EconomyConfig = {
  priceAdjustmentRate: number;
  maxPriceHistory: number;
};

export type ScheduleSlot = {
  id: string;
  startHour: number;
  endHour: number;
  activity: string;
  location: string;
  priority: number;
  flexibility: number;
};
export type DailySchedule = {
  npcId: NPCId;
  slots: ScheduleSlot[];
  currentSlotIndex: number;
  day: number;
};
export type ScheduleConfig = {
  adaptToPersonality: boolean;
  maxSlots: number;
};

export type SocialInteractionType =
  | 'conversation'
  | 'trade'
  | 'argument'
  | 'cooperation'
  | 'greeting'
  | 'farewell'
  | 'compliment'
  | 'insult'
  | 'gossip'
  | 'threat';
export type SocialInteraction = {
  id: string;
  type: SocialInteractionType;
  initiatorId: NPCId;
  targetId: NPCId;
  timestamp: number;
  outcome: 'positive' | 'neutral' | 'negative';
  trustDelta: number;
  description: string;
};
export type FactionId = string;
export type Faction = {
  id: FactionId;
  name: string;
  memberIds: NPCId[];
  reputation: number;
  relationships: Record<FactionId, number>;
};
export type GossipItem = {
  id: string;
  topic: string;
  aboutNPCId: NPCId;
  originatorId: NPCId;
  spreadTo: NPCId[];
  truth: number;
  timestamp: number;
  decayRate: number;
};
export type SocialConfig = {
  gossipDecayRate: number;
  maxGossipItems: number;
};

export type WorldLocation = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  capacity: number;
  currentOccupants: NPCId[];
};
export type WorldFact = {
  id: string;
  content: string;
  timestamp: number;
  knownBy: NPCId[];
  category: string;
};
export type WorldEventType =
  | 'storm'
  | 'festival'
  | 'plague'
  | 'drought'
  | 'invasion'
  | 'discovery'
  | 'migration'
  | 'market_crash';
export type WorldEvent = {
  id: string;
  type: WorldEventType;
  timestamp: number;
  description: string;
  affectedLocations: string[];
  economicImpact: Record<EconomyItemType, number>;
  duration: number;
};
export type WorldState = {
  day: number;
  hour: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  locations: Record<string, WorldLocation>;
  facts: WorldFact[];
  activeEvents: WorldEvent[];
};
export type WorldConfig = {
  dayLength: number;
  locations: WorldLocation[];
  initialFacts: WorldFact[];
};

export type BackgroundStats = {
  ticks: number;
  lastTickMs: number;
  avgTickMs: number;
  phaseTimings: Record<string, number>;
};

export type CacheEntry = {
  key: string;
  value: any;
  category: string;
  timestamp: number;
  ttl: number;
  lastAccessed: number;
  sizeBytes: number;
};
export type CacheStats = {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  totalEvictions: number;
  hitRate: number;
  estimatedMemoryBytes: number;
  entriesByCategory: Record<string, number>;
};
export type CacheConfig = {
  maxSize: number;
  maxMemoryBytes: number;
  defaultTtl: number;
};

export type BatchWriteEntry = {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  priority: number;
  timestamp: number;
  sizeBytes: number;
};
export type BatchWriteStats = {
  totalWrites: number;
  totalFlushes: number;
  pendingWrites: number;
  lastFlushMs: number;
  avgFlushSize: number;
  writesByTable: Record<string, number>;
};
export type BatchWriteConfig = {
  maxBatchSize: number;
  maxMemoryBytes: number;
  flushIntervalMs: number;
};

export type PersistenceCheckpoint = {
  id: string;
  timestamp: number;
  npcCount: number;
  eventCount: number;
  sizeBytes: number;
};
export type PersistenceStats = {
  totalCheckpoints: number;
  totalNPCsPersisted: number;
  totalEventsPersisted: number;
  lastCheckpointMs: number;
  avgCheckpointMs: number;
  isRunning: boolean;
  dirtyNPCs: number;
};
export type PersistenceConfig = {
  autoSaveIntervalMs: number;
  maxCheckpoints: number;
};

export type LODLevel = 'full' | 'reduced' | 'minimal' | 'dormant';
export type LODConfig = {
  level: LODLevel;
  tickIntervalMs: number;
  enabledModules: string[];
  memoryDecayRate: number;
  emotionDecayRate: number;
  maxThoughtsPerTick: number;
  enableSocial: boolean;
  enableTrading: boolean;
};
export type LODStats = {
  totalNPCs: number;
  fullCount: number;
  reducedCount: number;
  minimalCount: number;
  dormantCount: number;
  totalChanges: number;
};
export type LODConfigMap = Record<LODLevel, LODConfig>;

export type ChunkCoord = { x: number; y: number };
export type SimulationChunk = {
  coord: ChunkCoord;
  npcIds: NPCId[];
  lodLevel: LODLevel;
  lastTickMs: number;
  tickIntervalMs: number;
  isActive: boolean;
};
export type ChunkStats = {
  totalChunks: number;
  activeChunks: number;
  dormantChunks: number;
  totalNPCs: number;
  activeNPCs: number;
  avgNPCsPerChunk: number;
};
export type ChunkConfig = {
  chunkSize: number;
  activeRadius: number;
};

export type SchedulerTask = {
  id: string;
  name: string;
  priority: number;
  intervalMs: number;
  lastRunMs: number;
  avgExecutionMs: number;
  maxExecutionMs: number;
  executionCount: number;
  isOverBudget: boolean;
  enabled: boolean;
};
export type SchedulerStats = {
  totalTasks: number;
  totalExecutions: number;
  tasksOverBudget: number;
  budgetUtilization: number;
  budgetMs: number;
  tasks: SchedulerTask[];
};
export type SchedulerConfig = {
  budgetMs: number;
};

export type NPCCore = {
  id: NPCId;
  name: string;
  age: number;
  personality: PersonalityProfile;
  emotions: EmotionState;
  needs: NeedState;
  memories: MemorySystem;
  relationships: RelationshipMap;
  currentGoal: GOAPGoal | null;
  currentPlan: GOAPPlan | null;
  currentAction: string | null;
  position: Vec2;
  isAlive: boolean;
  thoughtHistory: string[];
  decisionHistory: UtilityDecision[];
  predictions: Prediction[];
  reflections: Reflection[];
  episodicEvents: EpisodicEvent[];
  personalityDriftHistory: PersonalityDriftEvent[];
  wallet: number;
  schedule: DailySchedule | null;
  factionId: FactionId | null;
  knownFacts: string[];
  lastTickMs: number;
  lodLevel: LODLevel;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  source: string;
  npcId?: NPCId;
};

export type PerformanceStats = {
  tickCount: number;
  lastTickMs: number;
  avgTickMs: number;
  maxTickMs: number;
  totalEvents: number;
  activeNPCs: number;
};

export type PluginManifest = {
  name: string;
  version: string;
  author: string;
  description: string;
  dependencies?: string[];
  permissions?: PluginPermission[];
};
export type PluginPermission =
  | 'read:npc'
  | 'write:npc'
  | 'read:events'
  | 'write:events'
  | 'read:world'
  | 'write:world'
  | 'register:actions'
  | 'register:goals'
  | 'register:debug-panels'
  | 'register:memory-types'
  | 'emit:events';
export type PluginContext = {
  runtime: any;
  eventBus: any;
  log(level: LogLevel, message: string, npcId?: NPCId): void;
  registerAction(action: GOAPAction): void;
  registerGoal(goal: GOAPGoal): void;
  registerDebugPanel(panel: DebugPanelConfig): void;
  getNPC(npcId: NPCId): NPCCore | undefined;
  getAllNPCs(): NPCCore[];
  getWorldState(): WorldState;
  emit(event: Omit<CognitiveEvent, 'id' | 'timestamp'>): void;
};
export type ElysiumPlugin = {
  manifest: PluginManifest;
  install(ctx: PluginContext): void;
  uninstall?(): void;
  onTick?(npcs: NPCCore[]): void;
  onEvent?(event: CognitiveEvent): void;
};
export type DebugPanelConfig = {
  id: string;
  name: string;
  icon?: string;
  render: (ctx: PluginContext) => any;
};
export type PublicAPIConfig = {
  autoStart?: boolean;
  tickIntervalMs?: number;
  maxNPCs?: number;
  enableCache?: boolean;
  enableBatchWrites?: boolean;
  enablePersistence?: boolean;
  enableScheduler?: boolean;
  enableLOD?: boolean;
  enableChunks?: boolean;
};
export type BenchmarkResult = {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSecond: number;
  memoryUsedBytes?: number;
};
export type BenchmarkSuite = {
  name: string;
  results: BenchmarkResult[];
  totalMs: number;
};
export type ElysiumSDKStats = {
  registeredPlugins: number;
  registeredActions: number;
  registeredGoals: number;
  registeredDebugPanels: number;
  apiCalls: number;
  uptime: number;
};

export type UserRole = 'owner' | 'admin' | 'moderator' | 'developer' | 'user';
export type AdminProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  settings: Record<string, any>;
  created_at: string | null;
  role: UserRole;
  banned: boolean;
  last_login: string | null;
};
export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  banned: boolean;
  created_at: string;
  last_login: string | null;
  session_count: number;
};
export type AdminKPIs = {
  totalUsers: number;
  onlineUsers: number;
  npcCount: number;
  runningSimulations: number;
  worldEvents: number;
  avgTickTime: number;
  memoryUsageMB: number;
  cpuUsage: number;
  apiCalls: number;
  pluginCount: number;
  worldAge: number;
  totalDecisions: number;
  relationshipCount: number;
  knowledgeEntries: number;
  economyTransactions: number;
};
export type AdminLogEntry = {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  timestamp: number;
  category: string;
  user_id?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
};
export type AuditLogEntry = {
  id: string;
  action: string;
  actor_id: string;
  actor_email: string;
  target_type: string;
  target_id: string;
  timestamp: number;
  details: Record<string, any>;
  ip_address: string;
};
export type AdminTableInfo = {
  name: string;
  row_count: number;
  size_bytes: number;
  indexes: string[];
};
export type AdminBackup = {
  id: string;
  name: string;
  created_at: string;
  size_bytes: number;
  type: 'full' | 'partial';
  status: 'completed' | 'failed' | 'in_progress';
};
export type AdminApiToken = {
  id: string;
  name: string;
  token_preview: string;
  created_at: string;
  last_used: string | null;
  permissions: string[];
  active: boolean;
};
export type AdminSession = {
  id: string;
  user_id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active: string;
  active: boolean;
};
