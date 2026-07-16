import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0e17',
    padding: '40px 20px',
  },
  card: {
    background: '#151c2c',
    border: '1px solid #2a3548',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
  },
  title: {
    color: '#e2e8f0',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '32px',
  },
  fieldGroup: {
    marginBottom: '24px',
  },
  label: {
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: '#0a0e17',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    background: '#0a0e17',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  emailDisplay: {
    color: '#94a3b8',
    fontSize: '14px',
    padding: '12px 14px',
    background: '#0a0e17',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  dangerButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    borderRadius: '8px',
    color: '#10b981',
    fontSize: '13px',
    padding: '12px',
    marginBottom: '20px',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '13px',
    padding: '12px',
    marginBottom: '20px',
  },
};

export default function SettingsPage(): JSX.Element {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile({ display_name: displayName, bio, avatar_url: avatarUrl });
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    try {
      await signOut();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Manage your account settings</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.emailDisplay}>{user?.email || ''}</div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              style={styles.textarea}
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Avatar URL</label>
            <input
              style={styles.input}
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div style={styles.buttonRow}>
            <button
              style={{ ...styles.primaryButton, ...(loading ? styles.buttonDisabled : {}) }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            <button style={styles.dangerButton} type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
