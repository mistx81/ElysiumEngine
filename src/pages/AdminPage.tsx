import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { ADMIN_SECTIONS } from '../types/admin';
import type { AdminSection } from '../types/admin';

const DashboardSection = lazy(() => import('../components/admin/Dashboard'));
const UsersSection = lazy(() => import('../components/admin/Users'));
const NPCsSection = lazy(() => import('../components/admin/NPCs'));
const WorldSection = lazy(() => import('../components/admin/World'));
const EventsSection = lazy(() => import('../components/admin/Events'));
const MemorySection = lazy(() => import('../components/admin/Memory'));
const EconomySection = lazy(() => import('../components/admin/Economy'));
const AnalyticsSection = lazy(() => import('../components/admin/Analytics'));
const LogsSection = lazy(() => import('../components/admin/Logs'));
const DatabaseSection = lazy(() => import('../components/admin/Database'));
const PluginsSection = lazy(() => import('../components/admin/Plugins'));
const SettingsSection = lazy(() => import('../components/admin/Settings'));
const SecuritySection = lazy(() => import('../components/admin/Security'));

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

const SECTION_COMPONENTS: Record<AdminSection, React.ComponentType<any>> = {
  dashboard: DashboardSection,
  users: UsersSection,
  npcs: NPCsSection,
  world: WorldSection,
  events: EventsSection,
  memory: MemorySection,
  economy: EconomySection,
  analytics: AnalyticsSection,
  logs: LogsSection,
  database: DatabaseSection,
  plugins: PluginsSection,
  settings: SettingsSection,
  security: SecuritySection,
};

const styles: Record<string, any> = {
  page: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    flexShrink: 0,
    backgroundColor: COLORS.card,
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px 20px 16px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  logo: {
    fontSize: '15px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    margin: 0,
    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.info})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  logoSub: {
    fontSize: '10px',
    color: COLORS.textMuted,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 20px',
    fontSize: '13px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: COLORS.text,
    borderLeft: `3px solid ${COLORS.accent}`,
    fontWeight: 600,
  },
  navItemHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  navIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
  navLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  userEmail: {
    fontSize: '12px',
    color: COLORS.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  roleDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.border}`,
    flexShrink: 0,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  topBarAccent: {
    width: '4px',
    height: '18px',
    backgroundColor: COLORS.accent,
    borderRadius: '2px',
  },
  topBarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.02em',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease, border-color 0.12s ease',
  },
  refreshIcon: {
    width: '14px',
    height: '14px',
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 24px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderBottom: `1px solid rgba(239, 68, 68, 0.3)`,
    color: COLORS.error,
    fontSize: '13px',
    flexShrink: 0,
  },
  errorIcon: {
    width: '16px',
    height: '16px',
    stroke: COLORS.error,
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    flexShrink: 0,
  },
  errorDismiss: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: COLORS.error,
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
    lineHeight: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
    overflow: 'auto',
    padding: '24px',
    backgroundColor: COLORS.bg,
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: COLORS.textMuted,
    fontSize: '14px',
    gap: '12px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  accessDenied: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: COLORS.warning,
    gap: '12px',
    textAlign: 'center',
  },
  deniedIcon: {
    fontSize: '40px',
    opacity: 0.5,
  },
};

const ROLE_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  owner: { bg: 'rgba(239, 68, 68, 0.15)', fg: COLORS.error, dot: COLORS.error },
  admin: { bg: 'rgba(245, 158, 11, 0.15)', fg: COLORS.warning, dot: COLORS.warning },
  moderator: { bg: 'rgba(6, 182, 212, 0.15)', fg: COLORS.info, dot: COLORS.info },
  developer: { bg: 'rgba(16, 185, 129, 0.15)', fg: COLORS.success, dot: COLORS.success },
  user: { bg: 'rgba(148, 163, 184, 0.15)', fg: COLORS.textMuted, dot: COLORS.textMuted },
};

export default function AdminPage(props: any) {
  const admin = useAdmin();
  const {
    loading,
    error,
    currentRole,
    allowedSections,
    canAccess,
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
    setError,
  } = admin;

  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => ADMIN_SECTIONS.filter((s) => allowedSections.includes(s.id)),
    [allowedSections],
  );

  const activeSectionMeta = useMemo(
    () => ADMIN_SECTIONS.find((s) => s.id === activeSection),
    [activeSection],
  );

  useEffect(() => {
    refreshKPIs();
  }, [refreshKPIs]);

  const refreshActiveSection = useCallback(
    (section: AdminSection) => {
      switch (section) {
        case 'dashboard':
          refreshKPIs();
          break;
        case 'users':
          refreshUsers({
            search: '',
            role: 'all',
            banned: 'all',
            page: 1,
            pageSize: 20,
          });
          break;
        case 'npcs':
          refreshNPCs();
          break;
        case 'world':
          refreshWorld();
          break;
        case 'events':
          refreshWorld();
          break;
        case 'memory':
          refreshNPCs();
          break;
        case 'economy':
          refreshKPIs();
          break;
        case 'analytics':
          refreshAnalytics();
          break;
        case 'logs':
          refreshAdminLogs();
          break;
        case 'database':
          refreshTableInfo();
          refreshBackups();
          break;
        case 'plugins':
          refreshPlugins();
          break;
        case 'settings':
          refreshSettings();
          break;
        case 'security':
          refreshSecurity();
          refreshAuditLogs();
          break;
      }
    },
    [
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
    ],
  );

  const handleSectionChange = useCallback(
    (section: AdminSection) => {
      if (!canAccess(section)) return;
      setActiveSection(section);
      refreshActiveSection(section);
    },
    [canAccess, refreshActiveSection],
  );

  const handleRefresh = useCallback(() => {
    refreshActiveSection(activeSection);
  }, [activeSection, refreshActiveSection]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, [setError]);

  const ActiveComponent = SECTION_COMPONENTS[activeSection];
  const roleStyle = ROLE_COLORS[currentRole] ?? ROLE_COLORS.user;

  const sectionProps = {
    ...admin,
    activeSection,
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logo}>ELYSIUM ADMIN</h1>
          <div style={styles.logoSub}>Enterprise Control Panel</div>
        </div>
        <nav style={styles.nav}>
          {visibleSections.map((section) => {
            const isActive = section.id === activeSection;
            const isHovered = hoveredNav === section.id;
            const itemStyle = {
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
              ...(!isActive && isHovered ? styles.navItemHover : {}),
            };
            return (
              <div
                key={section.id}
                style={itemStyle}
                onClick={() => handleSectionChange(section.id)}
                onMouseEnter={() => setHoveredNav(section.id)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <svg style={styles.navIcon} viewBox="0 0 24 24">
                  <path d={section.icon} />
                </svg>
                <span style={styles.navLabel}>{section.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>
              {props?.profile?.email ?? 'admin@elysium.io'}
            </span>
            <span
              style={{
                ...styles.roleBadge,
                backgroundColor: roleStyle.bg,
                color: roleStyle.fg,
              }}
            >
              <span style={{ ...styles.roleDot, backgroundColor: roleStyle.dot }} />
              {currentRole}
            </span>
          </div>
        </div>
      </aside>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.topBarAccent} />
            <h2 style={styles.topBarTitle}>
              {activeSectionMeta?.label ?? 'Dashboard'}
            </h2>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.refreshBtn} onClick={handleRefresh}>
              <svg style={styles.refreshIcon} viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <svg style={styles.errorIcon} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button style={styles.errorDismiss} onClick={handleDismissError}>
              ×
            </button>
          </div>
        )}

        <div style={styles.content}>
          {canAccess(activeSection) ? (
            <Suspense
              fallback={
                <div style={styles.loadingWrap}>
                  <div style={styles.spinner} />
                  Loading section...
                </div>
              }
            >
              <ActiveComponent {...sectionProps} />
            </Suspense>
          ) : (
            <div style={styles.accessDenied}>
              <div style={styles.deniedIcon}>⚠</div>
              <div>You do not have permission to access this section.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
