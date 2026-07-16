import React, { useState, useEffect, useMemo } from 'react';

const COLORS = {
  bg: '#0a0e17',
  card: '#151c2c',
  border: '#2a3548',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

function TrendArrow({ trend }: { trend: number }) {
  if (trend > 0) return <span style={{ color: COLORS.success, fontSize: 14 }}>▲ {trend.toFixed(1)}%</span>;
  if (trend < 0) return <span style={{ color: COLORS.error, fontSize: 14 }}>▼ {Math.abs(trend).toFixed(1)}%</span>;
  return <span style={{ color: COLORS.textDim, fontSize: 14 }}>— 0%</span>;
}

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  const barW = 100 / (data.length * 1.8);
  return (
    <svg viewBox="0 0 100 50" style={{ width: '100%', height: 140 }}>
      {data.map((d, i) => {
        const h = (d / max) * 40;
        const x = i * (barW * 1.8) + 2;
        return (
          <g key={i}>
            <rect x={x} y={44 - h} width={barW} height={h} fill={color} rx={1} opacity={0.85} />
            <text x={x + barW / 2} y={48} fill={COLORS.textDim} fontSize={2.5} textAnchor="middle">
              {labels[i]}
            </text>
            <text x={x + barW / 2} y={42 - h - 1} fill={COLORS.text} fontSize={2.5} textAnchor="middle">
              {d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function EconomySection(props: any) {
  const [market, setMarket] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editSupply, setEditSupply] = useState('');
  const [editDemand, setEditDemand] = useState('');

  useEffect(() => {
    const m = props.market || props.marketPrices || props.kpis?.market || [];
    setMarket(Array.isArray(m) ? m : []);
    const tx = props.transactions || props.tradeHistory || props.kpis?.transactions || [];
    setTransactions(Array.isArray(tx) ? tx : []);
    const w = props.wallets || props.npcWallets || props.kpis?.wallets || [];
    setWallets(Array.isArray(w) ? w : []);
  }, [props.market, props.marketPrices, props.transactions, props.tradeHistory, props.wallets, props.npcWallets, props.kpis]);

  const inflation = useMemo(() => {
    const avgPrice = market.length ? market.reduce((s, m) => s + (m.price || 0), 0) / market.length : 0;
    const basePrice = market.length ? market.reduce((s, m) => s + (m.basePrice || m.price || 0), 0) / market.length : 0;
    return basePrice > 0 ? ((avgPrice - basePrice) / basePrice) * 100 : 0;
  }, [market]);

  const topTraders = useMemo(() => {
    const map: Record<string, { volume: number; count: number }> = {};
    transactions.forEach((t) => {
      const name = t.buyer || t.seller || t.npc || 'unknown';
      if (!map[name]) map[name] = { volume: 0, count: 0 };
      map[name].volume += t.amount || t.value || t.price || 0;
      map[name].count += 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 8);
  }, [transactions]);

  const wealthData = useMemo(() => {
    const sorted = [...wallets].sort((a, b) => (b.balance || b.money || 0) - (a.balance || a.money || 0));
    return sorted.slice(0, 12);
  }, [wallets]);

  const startEdit = (item: any) => {
    setEditingItem(item.itemType || item.item || item.name || '');
    setEditPrice(String(item.price || 0));
    setEditSupply(String(item.supply || 0));
    setEditDemand(String(item.demand || 0));
  };

  const saveEdit = (item: any) => {
    setMarket((prev) =>
      prev.map((m) =>
        m === item
          ? { ...m, price: parseFloat(editPrice) || 0, supply: parseFloat(editSupply) || 0, demand: parseFloat(editDemand) || 0 }
          : m
      )
    );
    if (props.updateMarketItem) props.updateMarketItem(item, { price: parseFloat(editPrice), supply: parseFloat(editSupply), demand: parseFloat(editDemand) });
    setEditingItem(null);
  };

  const inputStyle: Record<string, any> = {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    width: 70,
  };

  const btnStyle: Record<string, any> = {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: COLORS.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Economy Management</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 8,
            background: COLORS.card,
            border: `1px solid ${inflation > 5 ? COLORS.error : inflation > 0 ? COLORS.warning : COLORS.success}`,
          }}
        >
          <span style={{ fontSize: 11, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Inflation</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: inflation > 5 ? COLORS.error : inflation > 0 ? COLORS.warning : COLORS.success }}>
            {inflation.toFixed(2)}%
          </span>
        </div>
      </div>

      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Money Distribution
        </div>
        {wealthData.length > 0 ? (
          <BarChart
            data={wealthData.map((w) => w.balance || w.money || 0)}
            labels={wealthData.map((w) => (w.npc || w.name || w.id || '').slice(0, 4))}
            color={COLORS.accent}
          />
        ) : (
          <div style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 20 }}>No wallet data available.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 13, background: COLORS.bg }}>
            Market Prices
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 80px 100px', padding: '6px 14px', fontSize: 10, fontWeight: 700, color: COLORS.textDim, textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.border}` }}>
            <span>Item</span>
            <span>Price</span>
            <span>Supply</span>
            <span>Demand</span>
            <span>Trend</span>
            <span>Edit</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {market.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: COLORS.textDim, fontSize: 13 }}>No market data.</div>}
            {market.map((item, i) => {
              const key = item.itemType || item.item || item.name || i;
              const isEditing = editingItem === key;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 70px 80px 100px', padding: '6px 14px', fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, alignItems: 'center' }}>
                  <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemType || item.item || item.name || '—'}</span>
                  {isEditing ? (
                    <input style={inputStyle} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                  ) : (
                    <span style={{ color: COLORS.success, fontWeight: 600 }}>{item.price || 0}</span>
                  )}
                  {isEditing ? (
                    <input style={inputStyle} value={editSupply} onChange={(e) => setEditSupply(e.target.value)} />
                  ) : (
                    <span style={{ color: COLORS.textDim }}>{item.supply || 0}</span>
                  )}
                  {isEditing ? (
                    <input style={inputStyle} value={editDemand} onChange={(e) => setEditDemand(e.target.value)} />
                  ) : (
                    <span style={{ color: COLORS.textDim }}>{item.demand || 0}</span>
                  )}
                  <span><TrendArrow trend={item.trend || 0} /></span>
                  {isEditing ? (
                    <button style={{ ...btnStyle, borderColor: COLORS.success, color: COLORS.success }} onClick={() => saveEdit(item)}>Save</button>
                  ) : (
                    <button style={btnStyle} onClick={() => startEdit(item)}>Edit</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 13, background: COLORS.bg }}>
            Top Traders
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {topTraders.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: COLORS.textDim, fontSize: 13 }}>No trade data.</div>}
            {topTraders.map(([name, data], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px', padding: '8px 14px', fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, alignItems: 'center' }}>
                <span style={{ color: COLORS.accent, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ color: COLORS.success, fontWeight: 600 }}>{data.volume.toFixed(0)}</span>
                <span style={{ color: COLORS.textDim }}>{data.count} tx</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 13, background: COLORS.bg }}>
            NPC Wallet Balances
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {wallets.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: COLORS.textDim, fontSize: 13 }}>No wallet data.</div>}
            {wallets.map((w, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', padding: '6px 14px', fontSize: 12, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.npc || w.name || w.id || '—'}</span>
                <span style={{ color: COLORS.success, fontWeight: 600, textAlign: 'right' }}>{w.balance || w.money || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 13, background: COLORS.bg }}>
            Transaction History
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {transactions.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: COLORS.textDim, fontSize: 13 }}>No transactions.</div>}
            {transactions.slice(0, 50).map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px', padding: '6px 14px', fontSize: 11, borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.textDim }}>{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '—'}</span>
                <span style={{ color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.buyer || t.npc || '—'} → {t.seller || '—'}: {t.itemType || t.item || '—'}
                </span>
                <span style={{ color: COLORS.success, fontWeight: 600, textAlign: 'right' }}>{t.amount || t.price || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
