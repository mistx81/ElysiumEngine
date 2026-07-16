import type { CognitiveEvent, EconomyItem, EconomyTransaction, NPCCore } from '../../engine/types';

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

const cardStyle: Record<string, any> = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

const headerStyle: Record<string, any> = {
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.text,
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tableStyle: Record<string, any> = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
};

const thStyle: Record<string, any> = {
  textAlign: 'left',
  padding: '6px 8px',
  color: COLORS.textDim,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: 11,
  textTransform: 'uppercase',
};

const tdStyle: Record<string, any> = {
  padding: '6px 8px',
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.text,
};

function trendArrow(history: number[]): string {
  if (history.length < 2) return '→';
  const recent = history[history.length - 1];
  const prev = history[history.length - 2];
  if (recent > prev) return '↑';
  if (recent < prev) return '↓';
  return '→';
}

function trendColor(arrow: string): string {
  if (arrow === '↑') return COLORS.success;
  if (arrow === '↓') return COLORS.error;
  return COLORS.textDim;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export default function EconomyPanel(props: any) {
  const selectedNPC: NPCCore | undefined = props.selectedNPC;
  const events: CognitiveEvent[] = props.events || [];
  const npcs: NPCCore[] = props.npcs || [];
  const marketItems: EconomyItem[] = props.marketItems || props.economyItems || [];

  const transactions: EconomyTransaction[] = events
    .filter((e) => e.type === 'ECONOMY_TRANSACTION')
    .map((e) => e.data as EconomyTransaction)
    .filter((t) => t && (!selectedNPC || t.buyerId === selectedNPC.id || t.sellerId === selectedNPC.id))
    .slice(0, 15);

  const wallet = selectedNPC ? selectedNPC.wallet : 0;

  const totalSupply = marketItems.reduce((s, i) => s + i.supply, 0);
  const totalDemand = marketItems.reduce((s, i) => s + i.demand, 0);
  const inflation = totalDemand > 0 ? ((totalDemand - totalSupply) / totalDemand) * 100 : 0;
  const inflationColor = inflation > 20 ? COLORS.error : inflation > 5 ? COLORS.warning : COLORS.success;

  const traderMap: Record<string, number> = {};
  transactions.forEach((t) => {
    traderMap[t.buyerId] = (traderMap[t.buyerId] || 0) + t.totalPrice;
    if (t.sellerId !== 'world') {
      traderMap[t.sellerId] = (traderMap[t.sellerId] || 0) + t.totalPrice;
    }
  });
  const topTraders = Object.entries(traderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, vol]) => {
      const npc = npcs.find((n) => n.id === id);
      return { name: npc ? npc.name : id, volume: vol };
    });

  const npcName = selectedNPC ? selectedNPC.name : 'Global Economy';

  return (
    <div style={{ background: COLORS.bg, padding: 12, color: COLORS.text, fontFamily: 'monospace', fontSize: 12 }}>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>ECONOMY MONITOR</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{npcName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>WALLET BALANCE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent }}>{wallet.toLocaleString()}g</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Inflation Indicator</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: inflationColor }}>
            {inflation > 0 ? '+' : ''}{inflation.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>
            Supply: {totalSupply.toLocaleString()} · Demand: {totalDemand.toLocaleString()}
          </div>
        </div>
        <div style={{ marginTop: 8, height: 6, background: COLORS.bg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(Math.abs(inflation), 100)}%`,
            height: '100%',
            background: inflationColor,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Market Prices</div>
        {marketItems.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No market data available</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Supply</th>
                <th style={thStyle}>Demand</th>
                <th style={thStyle}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {marketItems.map((item, idx) => {
                const arrow = trendArrow(item.priceHistory);
                return (
                  <tr key={idx}>
                    <td style={tdStyle}>{item.type}</td>
                    <td style={{ ...tdStyle, color: COLORS.accent }}>{item.currentPrice.toFixed(2)}g</td>
                    <td style={tdStyle}>{item.supply}</td>
                    <td style={tdStyle}>{item.demand}</td>
                    <td style={{ ...tdStyle, color: trendColor(arrow), fontSize: 14, fontWeight: 700 }}>{arrow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Transaction History</div>
        {transactions.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No transactions recorded</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Buyer</th>
                <th style={thStyle}>Seller</th>
                <th style={thStyle}>Item</th>
                <th style={thStyle}>Qty</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => {
                const buyer = npcs.find((n) => n.id === t.buyerId);
                const seller = t.sellerId === 'world' ? null : npcs.find((n) => n.id === t.sellerId);
                return (
                  <tr key={idx}>
                    <td style={{ ...tdStyle, color: COLORS.textDim }}>{formatTime(t.timestamp)}</td>
                    <td style={tdStyle}>{buyer ? buyer.name : t.buyerId}</td>
                    <td style={tdStyle}>{seller ? seller.name : 'world'}</td>
                    <td style={tdStyle}>{t.itemType}</td>
                    <td style={tdStyle}>{t.quantity}</td>
                    <td style={{ ...tdStyle, color: COLORS.success }}>{t.totalPrice.toFixed(2)}g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>Top Traders</div>
        {topTraders.length === 0 ? (
          <div style={{ color: COLORS.textDim, padding: 8 }}>No trader data</div>
        ) : (
          topTraders.map((trader, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.text }}>{idx + 1}. {trader.name}</span>
              <span style={{ color: COLORS.warning }}>{trader.volume.toFixed(2)}g</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
