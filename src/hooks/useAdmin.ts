import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import type {
  AdminKPIs,
  AdminUser,
  AdminUserFilters,
  AdminPaginatedResponse,
  AdminNPCSummary,
  AdminWorldControl,
  AdminAnalyticsData,
  AdminTableInfo,
  AdminBackup,
  AdminPluginInfo,
  AdminSettings,
  AdminSecurityInfo,
  AuditLogEntry,
  AdminLogEntry,
  UserRole,
  AdminSection,
} from '../types/admin';
import { ADMIN_SECTIONS, canManageRole, canAssignRole } from '../types/admin';
import * as adminService from '../services/admin';

export function useAdmin() {
  const { profile, isAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [users, setUsers] = useState<AdminPaginatedResponse<AdminUser> | null>(null);
  const [npcSummaries, setNpcSummaries] = useState<AdminNPCSummary[]>([]);
  const [worldControl, setWorldControl] = useState<AdminWorldControl | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [tableInfo, setTableInfo] = useState<AdminTableInfo[]>([]);
  const [backups, setBackups] = useState<AdminBackup[]>([]);
  const [plugins, setPlugins] = useState<AdminPluginInfo[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [securityInfo, setSecurityInfo] = useState<AdminSecurityInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>([]);

  const currentRole: UserRole = (profile?.role as UserRole) ?? 'user';

  const allowedSections: AdminSection[] = ADMIN_SECTIONS.filter((s) =>
    s.roles.includes(currentRole),
  ).map((s) => s.id);

  const canAccess = useCallback(
    (section: AdminSection): boolean => {
      const sec = ADMIN_SECTIONS.find((s) => s.id === section);
      if (!sec) return false;
      return sec.roles.includes(currentRole);
    },
    [currentRole],
  );

  const refreshKPIs = useCallback(async () => {
    try {
      const k = await adminService.fetchKPIs();
      setKpis(k);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const refreshUsers = useCallback(async (filters: AdminUserFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.fetchUsers(filters);
      setUsers(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNPCs = useCallback(() => {
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const refreshWorld = useCallback(() => {
    setWorldControl(adminService.fetchWorldControl());
  }, []);

  const refreshAnalytics = useCallback(() => {
    setAnalytics(adminService.fetchAnalytics());
  }, []);

  const refreshTableInfo = useCallback(async () => {
    try {
      const info = await adminService.fetchTableInfo();
      setTableInfo(info);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const refreshBackups = useCallback(async () => {
    const b = await adminService.fetchBackups();
    setBackups(b);
  }, []);

  const refreshPlugins = useCallback(() => {
    setPlugins(adminService.fetchPlugins());
  }, []);

  const refreshSettings = useCallback(() => {
    setSettings(adminService.fetchDefaultSettings());
  }, []);

  const refreshSecurity = useCallback(async () => {
    try {
      const info = await adminService.fetchSecurityInfo();
      setSecurityInfo(info);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    try {
      const logs = await adminService.fetchAuditLogs(50);
      setAuditLogs(logs);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const refreshAdminLogs = useCallback(async () => {
    try {
      const logs = await adminService.fetchAdminLogs(100);
      setAdminLogs(logs);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const changeUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!canAssignRole(currentRole, role)) {
        setError('Insufficient permissions to assign this role');
        return;
      }
      try {
        await adminService.updateUserRole(userId, role);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [currentRole],
  );

  const toggleBan = useCallback(
    async (userId: string, banned: boolean) => {
      try {
        await adminService.banUser(userId, banned);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [],
  );

  const removeUser = useCallback(async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const pauseSim = useCallback(() => {
    adminService.pauseSimulation();
    setWorldControl(adminService.fetchWorldControl());
  }, []);

  const resumeSim = useCallback((intervalMs?: number) => {
    adminService.resumeSimulation(intervalMs);
    setWorldControl(adminService.fetchWorldControl());
  }, []);

  const fastForward = useCallback((ticks: number) => {
    adminService.fastForwardSimulation(ticks);
    setWorldControl(adminService.fetchWorldControl());
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const spawnEvent = useCallback((eventType: string) => {
    adminService.spawnWorldEvent(eventType);
    setWorldControl(adminService.fetchWorldControl());
  }, []);

  const spawnNewNPC = useCallback((name: string, age: number) => {
    adminService.spawnNPC(name, age);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const killNPCById = useCallback((npcId: string) => {
    adminService.killNPC(npcId);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const respawnNPCById = useCallback((npcId: string) => {
    adminService.respawnNPC(npcId);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const teleportNPCById = useCallback((npcId: string, x: number, y: number) => {
    adminService.teleportNPC(npcId, x, y);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const freezeNPCById = useCallback((npcId: string) => {
    adminService.freezeNPC(npcId);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const resumeNPCById = useCallback((npcId: string) => {
    adminService.resumeNPC(npcId);
    setNpcSummaries(adminService.fetchNPCSummaries());
  }, []);

  const createToken = useCallback(async (name: string, permissions: string[]) => {
    try {
      await adminService.createApiToken(name, permissions);
      await refreshSecurity();
    } catch (e: any) {
      setError(e.message);
    }
  }, [refreshSecurity]);

  const revokeToken = useCallback(async (tokenId: string) => {
    try {
      await adminService.revokeApiToken(tokenId);
      await refreshSecurity();
    } catch (e: any) {
      setError(e.message);
    }
  }, [refreshSecurity]);

  return {
    loading,
    error,
    kpis,
    users,
    npcSummaries,
    worldControl,
    analytics,
    tableInfo,
    backups,
    plugins,
    settings,
    securityInfo,
    auditLogs,
    adminLogs,
    currentRole,
    isAdmin,
    isStaff,
    allowedSections,
    canAccess,
    canManageRole: (target: UserRole) => canManageRole(currentRole, target),
    canAssignRole: (target: UserRole) => canAssignRole(currentRole, target),
    refreshKPIs,
    refreshUsers,
    refreshNPCs,
    refreshWorld,
    refreshAnalytics,
    refreshTableInfo,
    refreshBackups,
    refreshPlugins,
    refreshSettings,
    refreshSecurity,
    refreshAuditLogs,
    refreshAdminLogs,
    changeUserRole,
    toggleBan,
    removeUser,
    pauseSim,
    resumeSim,
    fastForward,
    spawnEvent,
    spawnNewNPC,
    killNPCById,
    respawnNPCById,
    teleportNPCById,
    freezeNPCById,
    resumeNPCById,
    createToken,
    revokeToken,
    setError,
  };
}
