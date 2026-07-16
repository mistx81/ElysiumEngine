import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const DeveloperPage = lazy(() => import('./pages/DeveloperPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/auth/SettingsPage'));

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
};

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];
const AUTH_ROUTES = ['/profile', '/settings', '/developer', '/admin'];
const ADMIN_ROUTES = ['/admin'];

function getHashRoute(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

function navigate(path: string): void {
  window.location.hash = path;
}

const styles: Record<string, any> = {
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: COLORS.bg,
    color: COLORS.textMuted,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    gap: '12px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  navBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    backgroundColor: COLORS.card,
    borderBottom: `1px solid ${COLORS.border}`,
    flexShrink: 0,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.text,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    userSelect: 'none',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: {
    padding: '6px 12px',
    fontSize: '13px',
    color: COLORS.textMuted,
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'color 0.15s ease, background-color 0.15s ease',
    userSelect: 'none',
  },
  navLinkActive: {
    color: COLORS.text,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: COLORS.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
  },
  page: {
    height: 'calc(100vh - 56px)',
    width: '100%',
    overflow: 'hidden',
  },
  authPage: {
    height: 'calc(100vh - 56px)',
    width: '100%',
    overflow: 'auto',
  },
};

function LoadingFallback() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner} />
      <span>Loading...</span>
    </div>
  );
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'owner': return COLORS.error;
    case 'admin': return COLORS.warning;
    case 'moderator': return COLORS.accent;
    case 'developer': return COLORS.success;
    default: return COLORS.textMuted;
  }
}

function NavBar({ route }: { route: string }) {
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const isStaff = isAdmin || profile?.role === 'moderator';

  const linkStyle = (path: string): Record<string, any> => ({
    ...styles.navLink,
    ...(route === path ? styles.navLinkActive : {}),
  });

  return (
    <nav style={styles.navBar}>
      <div style={styles.navLeft}>
        <span style={styles.logo} onClick={() => navigate('/')}>ELYSIUM</span>
        <div style={styles.navLinks}>
          <span style={linkStyle('/')} onClick={() => navigate('/')}>Home</span>
          <span style={linkStyle('/developer')} onClick={() => navigate('/developer')}>Developer</span>
          {isAdmin && (
            <span style={linkStyle('/admin')} onClick={() => navigate('/admin')}>Admin</span>
          )}
        </div>
      </div>
      <div style={styles.navRight}>
        {user ? (
          <>
            {profile?.role && (
              <span style={{ ...styles.roleBadge, color: getRoleColor(profile.role), backgroundColor: `${getRoleColor(profile.role)}22` }}>
                {profile.role}
              </span>
            )}
            <span style={linkStyle('/profile')} onClick={() => navigate('/profile')}>Profile</span>
            <span style={linkStyle('/settings')} onClick={() => navigate('/settings')}>Settings</span>
            <span style={styles.navLink} onClick={() => { signOut(); navigate('/'); }}>Sign Out</span>
            <div style={styles.avatar} onClick={() => navigate('/profile')}>
              {(profile?.display_name || user.email || '?')[0].toUpperCase()}
            </div>
          </>
        ) : (
          <>
            <span style={linkStyle('/login')} onClick={() => navigate('/login')}>Sign In</span>
            <span style={linkStyle('/register')} onClick={() => navigate('/register')}>Register</span>
          </>
        )}
      </div>
    </nav>
  );
}

function Router() {
  const { user, profile, loading } = useAuth();
  const [route, setRoute] = useState<string>(getHashRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateCb = useCallback((path: string) => navigate(path), []);

  if (loading) return <LoadingFallback />;

  const isPublic = PUBLIC_ROUTES.includes(route);
  const requiresAuth = AUTH_ROUTES.includes(route);
  const requiresAdmin = ADMIN_ROUTES.includes(route);

  if (requiresAuth && !user) {
    navigate('/login');
    return <LoadingFallback />;
  }

  if (requiresAdmin && (!profile || (profile.role !== 'owner' && profile.role !== 'admin'))) {
    navigate('/');
    return <LoadingFallback />;
  }

  if (route === '/login' && user) {
    navigate('/');
    return <LoadingFallback />;
  }

  let content: React.ReactNode;

  switch (route) {
    case '/':
      content = <HomePage />;
      break;
    case '/developer':
      content = <DeveloperPage />;
      break;
    case '/admin':
      content = <AdminPage />;
      break;
    case '/login':
      content = <LoginPage navigate={navigateCb} />;
      break;
    case '/register':
      content = <RegisterPage navigate={navigateCb} />;
      break;
    case '/forgot-password':
      content = <ForgotPasswordPage navigate={navigateCb} />;
      break;
    case '/profile':
      content = <ProfilePage />;
      break;
    case '/settings':
      content = <SettingsPage />;
      break;
    default:
      content = <HomePage />;
  }

  const isAuthPage = ['/login', '/register', '/forgot-password', '/profile', '/settings'].includes(route);
  const pageStyle = isAuthPage ? styles.authPage : styles.page;

  return (
    <>
      <NavBar route={route} />
      <div style={pageStyle}>
        <Suspense fallback={<LoadingFallback />}>
          {content}
        </Suspense>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
