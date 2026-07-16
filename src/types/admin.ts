export type UserRole = 'owner' | 'admin' | 'moderator' | 'developer' | 'user';

export interface AdminProfile {
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
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  banned: boolean;
  created_at: string;
  last_login: string | null;
  session_count: number;
}

export interface AdminKPIs {
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
}

export interface AdminLogEntry {
  id: string;
  level: string;
  source: string;
  message: string;
  timestamp: number;
  category: string;
  user_id?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_email: string;
  target_type: string;
  target_id: string;
  timestamp: number;
  details: Record<string, any>;
  ip_address: string;
}

export interface AdminTableInfo {
  name: string;
  row_count: number;
  size_bytes: number;
  indexes: string[];
}

export interface AdminBackup {
  id: string;
  name: string;
  created_at: string;
  size_bytes: number;
  type: 'full' | 'partial';
  status: 'completed' | 'failed' | 'in_progress';
}

export interface AdminApiToken {
  id: string;
  name: string;
  token_preview: string;
  created_at: string;
  last_used: string | null;
  permissions: string[];
  active: boolean;
}

export interface AdminSession {
  id: string;
  user_id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active: string;
  active: boolean;
}

export interface AdminUserFilters {
  search: string;
  role: UserRole | 'all';
  banned: 'all' | 'banned' | 'active';
  page: number;
  pageSize: number;
}

export interface AdminEventFilters {
  search: string;
  type: string | 'all';
  severity: string | 'all';
  page: number;
  pageSize: number;
}

export interface AdminMemoryFilters {
  search: string;
  type: string | 'all';
  npcId: string | 'all';
  page: number;
  pageSize: number;
}

export interface AdminLogFilters {
  search: string;
  level: string | 'all';
  category: string | 'all';
  page: number;
  pageSize: number;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminNPCSummary {
  id: string;
  name: string;
  age: number;
  isAlive: boolean;
  mood: string;
  currentAction: string | null;
  currentGoal: string | null;
  memoryCount: number;
  relationshipCount: number;
  wallet: number;
  lodLevel: string;
  position: { x: number; y: number };
}

export interface AdminWorldControl {
  day: number;
  hour: number;
  season: string;
  weather: string;
  isPaused: boolean;
  activeEvents: any[];
}

export interface AdminAnalyticsData {
  npcGrowth: { label: string; value: number }[];
  decisionRate: { label: string; value: number }[];
  emotionDistribution: { label: string; value: number }[];
  goalCompletion: { label: string; value: number }[];
  memoryGrowth: { label: string; value: number }[];
  cpuUsage: { label: string; value: number }[];
  ramUsage: { label: string; value: number }[];
  tickDuration: { label: string; value: number }[];
  cacheHits: { label: string; value: number }[];
  dbWrites: { label: string; value: number }[];
  pluginUsage: { label: string; value: number }[];
  apiCalls: { label: string; value: number }[];
}

export interface AdminPluginInfo {
  id: string;
  name: string;
  version: string;
  status: 'enabled' | 'disabled' | 'error';
  dependencies: string[];
  permissions: string[];
  author: string;
  description: string;
}

export interface AdminSettings {
  world: {
    timeScale: number;
    autoSaveInterval: number;
    maxNPCs: number;
    seasonLength: number;
  };
  runtime: {
    tickInterval: number;
    backgroundInterval: number;
    maxEvents: number;
    enableReplay: boolean;
  };
  performance: {
    lodEnabled: boolean;
    chunkingEnabled: boolean;
    cacheMaxEntries: number;
    batchWriteInterval: number;
    schedulerBudgetMs: number;
  };
  auth: {
    allowRegistration: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  storage: {
    maxBackups: number;
    compressionEnabled: boolean;
    exportFormat: string;
  };
  security: {
    rateLimitPerMinute: number;
    csrfEnabled: boolean;
    corsOrigins: string[];
    inputValidation: boolean;
    sqlInjectionProtection: boolean;
    xssProtection: boolean;
  };
}

export interface AdminSecurityInfo {
  auditLogs: AuditLogEntry[];
  failedLogins: AdminLogEntry[];
  activeSessions: AdminSession[];
  apiTokens: AdminApiToken[];
  rateLimitStatus: { current: number; max: number; resetAt: string };
  securityFlags: {
    csrfEnabled: boolean;
    corsEnabled: boolean;
    inputValidation: boolean;
    sqlInjectionProtection: boolean;
    xssProtection: boolean;
  };
}

export type AdminSection =
  | 'dashboard'
  | 'users'
  | 'npcs'
  | 'world'
  | 'events'
  | 'memory'
  | 'economy'
  | 'analytics'
  | 'logs'
  | 'database'
  | 'plugins'
  | 'settings'
  | 'security';

export const ADMIN_SECTIONS: { id: AdminSection; label: string; icon: string; roles: UserRole[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', roles: ['owner', 'admin', 'moderator', 'developer'] },
  { id: 'users', label: 'Users', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-6 0', roles: ['owner', 'admin', 'moderator'] },
  { id: 'npcs', label: 'NPCs', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20z', roles: ['owner', 'admin', 'developer'] },
  { id: 'world', label: 'World', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['owner', 'admin', 'developer'] },
  { id: 'events', label: 'Events', icon: 'M13 10V3L4 14h7v7l9-11h-7z', roles: ['owner', 'admin', 'moderator', 'developer'] },
  { id: 'memory', label: 'Memory', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', roles: ['owner', 'admin', 'developer'] },
  { id: 'economy', label: 'Economy', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1', roles: ['owner', 'admin', 'developer'] },
  { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['owner', 'admin', 'developer'] },
  { id: 'logs', label: 'Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', roles: ['owner', 'admin', 'moderator'] },
  { id: 'database', label: 'Database', icon: 'M4 7v10c0 2 4 3 8 3s8-1 8-3V7M4 7c0-2 4-3 8-3s8 1 8 3M4 7c0 2 4 3 8 3s8-1 8-3M4 12c0 2 4 3 8 3s8-1 8-3', roles: ['owner', 'admin'] },
  { id: 'plugins', label: 'Plugins', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4', roles: ['owner', 'admin', 'developer'] },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: ['owner', 'admin'] },
  { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['owner', 'admin'] },
];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  moderator: 3,
  developer: 2,
  user: 1,
};

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin';
  return false;
}
