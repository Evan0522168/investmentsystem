import { useState, useEffect } from 'react';
import { getPortfolio, getTradeHistory } from '../api';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    Promise.all([getPortfolio(), getTradeHistory()])
      .then(([p, t]) => {
        setPortfolio(p.data);
        setTrades(t.data.trades);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const S = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' },
    label: { fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' },
    tab: (active) => ({ padding: '8px 16px', background: 'none', border: 'none', borderBottom: active ? '2px solid #00e87a' : '2px solid transparent', color: active ? '#00e87a' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }),
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#00e87a', fontSize: '12px', letterSpacing: '2px' }}>載入中...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#00e87a', letterSpacing: '2px' }}>💼 投資組合</div>

      {portfolio && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: '總資產', val: `$${portfolio.total_value.toLocaleString()}`, color: '#00e87a' },
            { label: '現金', val: `$${portfolio.cash.toLocaleString()}`, color: '#4db8ff' },
            { label: '持股市值', val: `$${portfolio.stock_value.toLocaleString()}`, color: '#ffd700' },
            { label: '總損益', val: `${portfolio.pnl >= 0 ? '+' : ''}$${portfolio.pnl.toFixed(0)} (${portfolio.pnl_pct.toFixed(2)}%)`, color: portfolio.pnl >= 0 ? '#00e87a' : '#ff4757' },
          ].map(({ label, val, color }) => (
            <div key={label} style={S.card}>
              <div style={S.label}>{label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['summary', 'history'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'summary' ? '持股明細' : '交易紀錄'}
          </button>
        ))}
      </div>

      {tab === 'summary' && portfolio && (
        <div style={S.card}>
          {portfolio.holdings.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '20px 0' }}>目前無持股</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>{['代碼', '持股數', '均價', '現價', '市值', '損益', '損益%'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '1.5px' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {portfolio.holdings.map(h => (
                  <tr key={h.stock_id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#00e87a', fontWeight: 700 }}>{h.stock_id}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{h.shares}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{h.avg_cost}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{h.current_price}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{h.market_value.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: h.pnl >= 0 ? '#00e87a' : '#ff4757' }}>{h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: h.pnl_pct >= 0 ? '#00e87a' : '#ff4757' }}>{h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div style={S.card}>
          {trades.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '20px 0' }}>尚無交易紀錄</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>{['時間', '操作', '代碼', '股數', '價格', '金額'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '1.5px' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t.time}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: t.action === 'BUY' ? 'rgba(0,232,122,0.15)' : 'rgba(255,71,87,0.15)', color: t.action === 'BUY' ? '#00e87a' : '#ff4757' }}>{t.action === 'BUY' ? '買入' : '賣出'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#00e87a', fontWeight: 700 }}>{t.stock_id}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{t.shares}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{t.price}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{t.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
