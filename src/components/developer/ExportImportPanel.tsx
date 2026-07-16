import { useState, useRef } from 'react';

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
  btn: {
    backgroundColor: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSuccess: {
    backgroundColor: COLORS.success,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnWarn: {
    backgroundColor: COLORS.warning,
    color: '#0a0e17',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  textarea: {
    width: '100%',
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
    resize: 'vertical',
    minHeight: '160px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  warningBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    border: `1px solid ${COLORS.warning}`,
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '12px',
    color: COLORS.warning,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formatBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: 'rgba(6,182,212,0.15)',
    color: COLORS.info,
  },
  statusText: { fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' },
};

export default function ExportImportPanel(props: any) {
  const [exportedJson, setExportedJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [format, setFormat] = useState<string>('—');
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const handler = props.exportState;
      if (typeof handler !== 'function') {
        setStatus('ERROR: exportState handler not available.');
        return;
      }
      const json = handler();
      setExportedJson(json);
      setStatus('State exported successfully.');
      try {
        JSON.parse(json);
        setFormat('JSON (valid)');
      } catch {
        setFormat('JSON (raw string)');
      }
    } catch (err: any) {
      setStatus(`Export error: ${err?.message ?? err}`);
    }
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      setStatus('ERROR: Paste JSON to import first.');
      return;
    }
    try {
      JSON.parse(importJson);
    } catch (err: any) {
      setStatus(`ERROR: Invalid JSON — ${err?.message ?? err}`);
      return;
    }
    try {
      const handler = props.importState;
      if (typeof handler !== 'function') {
        setStatus('ERROR: importState handler not available.');
        return;
      }
      handler(importJson);
      setStatus('State imported successfully.');
    } catch (err: any) {
      setStatus(`Import error: ${err?.message ?? err}`);
    }
  };

  const handleDownload = () => {
    const data = exportedJson || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elysium-state-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded state file.');
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      setImportJson(text);
      setExportedJson(text);
      setStatus(`Loaded file: ${file.name} (${file.size} bytes)`);
      try {
        JSON.parse(text);
        setFormat('JSON (valid)');
      } catch {
        setFormat('JSON (unvalidated)');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.container}>
      <div style={styles.warningBox}>
        <span style={{ fontSize: '16px' }}>⚠</span>
        <span>Importing state will <strong>overwrite</strong> all current engine state including NPCs, events, and memories. Export first to create a backup.</span>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Export State</div>
          <span style={styles.formatBadge}>Format: {format}</span>
        </div>
        <div style={{ ...styles.btnRow, marginBottom: '10px' }}>
          <button style={styles.btn} onClick={handleExport}>Export State</button>
          <button style={styles.btnSuccess} onClick={handleDownload} disabled={!exportedJson}>Download as File</button>
        </div>
        <textarea
          style={styles.textarea}
          readOnly
          placeholder="Click 'Export State' to generate JSON..."
          value={exportedJson}
          onChange={() => {}}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Import State</div>
        <div style={{ ...styles.btnRow, marginBottom: '10px' }}>
          <button style={styles.btnWarn} onClick={handleImport}>Import State</button>
          <button style={styles.btn} onClick={() => importFileRef.current?.click()}>Upload File</button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleUploadFile}
          />
        </div>
        <textarea
          style={styles.textarea}
          placeholder="Paste exported JSON here, or upload a file..."
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
        {status && <div style={styles.statusText}>{status}</div>}
      </div>
    </div>
  );
}
