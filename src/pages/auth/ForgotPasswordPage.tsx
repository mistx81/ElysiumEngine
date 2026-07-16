import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0e17',
    padding: '20px',
  },
  card: {
    background: '#151c2c',
    border: '1px solid #2a3548',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    color: '#e2e8f0',
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '32px',
    textAlign: 'center',
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
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '24px',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
  linkContainer: {
    textAlign: 'center',
  },
  link: {
    color: '#3b82f6',
    fontSize: '13px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
};

export default function ForgotPasswordPage({ navigate }: { navigate: (path: string) => void }): JSX.Element {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset link sent. Check your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>Enter your email to receive a reset link</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <button style={styles.link} onClick={() => navigate('/login')}>
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
