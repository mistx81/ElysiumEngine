import { useState, useMemo, useRef } from 'react';
import type { ElysiumPlugin, PluginPermission } from '../../engine/types';
import { PluginManager } from '../../sdk/plugin-manager';

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

const ALL_PERMISSIONS: PluginPermission[] = [
  'read:npc', 'write:npc',
  'read:events', 'write:events',
  'read:world', 'write:world',
  'register:actions', 'register:goals',
  'register:debug-panels', 'register:memory-types',
  'emit:events',
];

const LIFECYCLE_HOOKS = ['install', 'uninstall', 'onTick', 'onEvent'] as const;

const styles: Record<string, any> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' },
  card: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '16px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: COLORS.textMuted,
    marginBottom: '12px',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' },
  statBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
  },
  statLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.textMuted, marginBottom: '4px' },
  statValue: { fontSize: '20px', fontWeight: 700, color: COLORS.text },
  pluginRow: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
  },
  pluginHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  pluginName: { fontSize: '14px', fontWeight: 700, color: COLORS.text },
  pluginMeta: { fontSize: '11px', color: COLORS.textMuted, fontFamily: 'monospace' },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  },
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: {
    backgroundColor: 'transparent',
    color: COLORS.error,
    border: `1px solid ${COLORS.error}`,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSuccess: {
    backgroundColor: 'transparent',
    color: COLORS.success,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  input: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    flex: 1,
    outline: 'none',
  },
  permChip: {
    display: 'inline-block',
    padding: '2px 6px',
    margin: '2px',
    borderRadius: '3px',
    fontSize: '10px',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(6,182,212,0.12)',
    color: COLORS.info,
    border: `1px solid ${COLORS.info}33`,
  },
  hookRow: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', fontFamily: 'monospace' },
  hookDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' },
  scrollArea: { maxHeight: '400px', overflowY: 'auto' },
  row: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  statusText: { fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' },
};

export default function PluginsPanel(props: any) {
  const [plugins, setPlugins] = useState<ElysiumPlugin[]>([]);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [installUrl, setInstallUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pluginManager = useMemo<PluginManager | null>(() => {
    const runtime = props.runtime;
    if (runtime && typeof runtime.getPluginManager === 'function') {
      try { return runtime.getPluginManager(); } catch { return null; }
    }
    if (runtime && typeof runtime.getPluginManager === 'function') {
      try { return runtime.getPluginManager(); } catch { return null; }
    }
    return null;
  }, [props.runtime]);

  useMemo(() => {
    if (pluginManager) {
      try { setPlugins(pluginManager.getLoadedPlugins()); } catch { setPlugins([]); }
    }
  }, [pluginManager]);

  const togglePlugin = (name: string) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleInstall = () => {
    if (!installUrl.trim()) {
      setStatus('ERROR: Enter a plugin URL or select a file.');
      return;
    }
    setStatus(`Plugin URL "${installUrl}" queued for install. (Dynamic loading requires a module loader.)`);
    setInstallUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(`File "${file.name}" (${file.size} bytes) selected. Plugin manifest validation pending.`);
  };

  const getHookStatus = (plugin: ElysiumPlugin, hook: string): boolean => {
    if (hook === 'install') return true;
    return typeof (plugin as any)[hook] === 'function';
  };

  const stats = pluginManager?.getStats?.() ?? { loadedPlugins: plugins.length, registeredActions: 0, registeredGoals: 0, pluginNames: [] };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Plugin Manager</div>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Loaded Plugins</div>
            <div style={styles.statValue}>{stats.loadedPlugins}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Registered Actions</div>
            <div style={styles.statValue}>{stats.registeredActions}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Registered Goals</div>
            <div style={styles.statValue}>{stats.registeredGoals}</div>
          </div>
        </div>
        <div style={styles.row}>
          <input
            type="text"
            style={styles.input}
            placeholder="Plugin URL (e.g. https://example.com/my-plugin.js)"
            value={installUrl}
            onChange={(e) => setInstallUrl(e.target.value)}
          />
          <button style={styles.btn} onClick={handleInstall}>Install</button>
          <button style={styles.btn} onClick={() => fileRef.current?.click()}>Upload File</button>
          <input
            ref={fileRef}
            type="file"
            accept=".js,.json,.ts"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
        {status && <div style={styles.statusText}>{status}</div>}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Installed Plugins</div>
        <div style={styles.scrollArea}>
          {plugins.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
              No plugins loaded. Use the install controls above to add a plugin.
            </div>
          ) : (
            plugins.map((plugin) => {
              const isDisabled = disabled.has(plugin.manifest.name);
              const perms = plugin.manifest.permissions ?? [];
              const deps = plugin.manifest.dependencies ?? [];
              return (
                <div key={plugin.manifest.name} style={styles.pluginRow}>
                  <div style={styles.pluginHeader}>
                    <div>
                      <span style={styles.pluginName}>{plugin.manifest.name}</span>
                      <span style={{ ...styles.pluginMeta, marginLeft: '8px' }}>v{plugin.manifest.version}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: isDisabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: isDisabled ? COLORS.error : COLORS.success,
                      }}>
                        {isDisabled ? 'DISABLED' : 'ENABLED'}
                      </span>
                      <button
                        style={isDisabled ? styles.btnSuccess : styles.btnDanger}
                        onClick={() => togglePlugin(plugin.manifest.name)}
                      >
                        {isDisabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '6px' }}>
                    {plugin.manifest.description}
                  </div>
                  <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px' }}>
                    Author: {plugin.manifest.author}
                    {deps.length > 0 && <span> · Dependencies: {deps.join(', ')}</span>}
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: COLORS.textMuted, textTransform: 'uppercase' }}>Permissions:</span>
                    <div>
                      {perms.length === 0 ? (
                        <span style={{ fontSize: '11px', color: COLORS.textMuted }}>None requested</span>
                      ) : (
                        perms.map((p) => (
                          <span key={p} style={styles.permChip}>{p}</span>
                        ))
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {LIFECYCLE_HOOKS.map((hook) => {
                      const has = getHookStatus(plugin, hook);
                      return (
                        <div key={hook} style={styles.hookRow}>
                          <span style={{ ...styles.hookDot, backgroundColor: has ? COLORS.success : COLORS.border }} />
                          <span style={{ color: has ? COLORS.text : COLORS.textMuted }}>{hook}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Available Permissions</div>
        <div>
          {ALL_PERMISSIONS.map((p) => (
            <span key={p} style={styles.permChip}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
