import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getPrice, getHistory, getAnalysis, executeTrade } from '../api';

export default function Dashboard({ stockId, onBack }) {
  const [price, setPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('chart');
  const [shares, setShares] = useState(100);
  const [tradeMsg, setTradeMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getPrice(stockId),
      getHistory(stockId, 90),
      getAnalysis(stockId)
    ]).then(([p, h, a]) => {
      setPrice(p.data);
      setHistory(h.data.data);
      setAnalysis(a.data);
      setLoading(false);
    }).catch(e => {
      setError('資料載入失敗，請確認 API 是否運行中');
      setLoading(false);
    });
  }, [stockId]);

  const trade = async (action) => {
    try {
      await executeTrade(stockId, shares, price.latest_close, action);
      setTradeMsg(`✅ ${action === 'buy' ? '買入' : '賣出'} ${shares} 股 @ ${price.latest_close} 成功`);
      setTimeout(() => setTradeMsg(''), 3000);
    } catch (e) {
      setTradeMsg(`❌ 交易失敗：${e.response?.data?.detail || e.message}`);
      setTimeout(() => setTradeMsg(''), 3000);
    }
  };

  const S = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' },
    label: { fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' },
    tab: (active) => ({ padding: '8px 16px', background: 'none', border: 'none', borderBottom: active ? '2px solid #00e87a' : '2px solid transparent', color: active ? '#00e87a' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }),
    pill: (sig) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: sig === 'BUY' || sig === 'BULLISH' || sig === 'UPTREND' || sig === 'OVERSOLD' ? 'rgba(0,232,122,0.15)' : sig === 'SELL' || sig === 'BEARISH' || sig === 'DOWNTREND' || sig === 'OVERBOUGHT' ? 'rgba(255,71,87,0.15)' : 'rgba(255,215,0,0.15)', color: sig === 'BUY' || sig === 'BULLISH' || sig === 'UPTREND' || sig === 'OVERSOLD' ? '#00e87a' : sig === 'SELL' || sig === 'BEARISH' || sig === 'DOWNTREND' || sig === 'OVERBOUGHT' ? '#ff4757' : '#ffd700' }),
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#00e87a' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>⟳</div>
      <div style={{ letterSpacing: '2px', fontSize: '12px' }}>載入資料中...</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#ff4757' }}>
      <div style={{ marginBottom: '16px' }}>⚠ {error}</div>
      <button onClick={onBack} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#e8edf2', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}>← 返回</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ padding: '6px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>← 返回</button>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{stockId}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>台灣證券交易所</div>
        </div>
        {price && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#00e87a' }}>TWD {price.latest_close}</div>
            <div style={{ fontSize: '13px', color: price.change >= 0 ? '#00e87a' : '#ff4757' }}>
              {price.change >= 0 ? '▲' : '▼'} {Math.abs(price.change)} ({Math.abs(price.change_pct)}%)
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {price && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: '52W 高', val: price.high_52w, color: '#ffd700' },
            { label: '52W 低', val: price.low_52w, color: '#4db8ff' },
            { label: '平均成交量', val: (price.avg_volume / 1000000).toFixed(1) + 'M', color: 'rgba(255,255,255,0.7)' },
            { label: '資料天數', val: price.total_days, color: 'rgba(255,255,255,0.7)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={S.card}>
              <div style={S.label}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['chart', 'indicators', 'trade'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'chart' ? '📈 圖表' : t === 'indicators' ? '📊 指標' : '💰 交易'}
          </button>
        ))}
      </div>

      {/* Chart Tab */}
      {tab === 'chart' && (
        <div style={S.card}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>▲ 近 90 天收盤價</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,232,122,0.3)', borderRadius: '6px', color: '#e8edf2', fontSize: '11px' }} />
              <Line type="monotone" dataKey="close" stroke="#00e87a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', margin: '20px 0 12px' }}>▲ 成交量</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={history}>
              <XAxis dataKey="date" tick={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} />
              <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e8edf2', fontSize: '11px' }} formatter={v => [(v / 1000000).toFixed(1) + 'M', '成交量']} />
              <Bar dataKey="volume" fill="rgba(77,184,255,0.4)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Indicators Tab */}
      {tab === 'indicators' && analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'RSI (14)', val: analysis.rsi, sig: analysis.rsi_signal },
              { label: 'MACD', val: analysis.macd.macd_line, sig: analysis.macd.signal },
              { label: '趨勢', val: `SMA20: ${analysis.moving_averages.sma20}`, sig: analysis.moving_averages.trend },
            ].map(({ label, val, sig }) => (
              <div key={label} style={S.card}>
                <div style={S.label}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{val}</div>
                <span style={S.pill(sig)}>{sig}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>∑ 完整指標</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr>{['指標', '數值', '訊號'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '1.5px' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  { name: 'RSI (14)', val: analysis.rsi, sig: analysis.rsi_signal },
                  { name: 'MACD Line', val: analysis.macd.macd_line, sig: analysis.macd.signal },
                  { name: 'MACD Signal', val: analysis.macd.signal_line, sig: '—' },
                  { name: 'SMA 20', val: analysis.moving_averages.sma20, sig: analysis.moving_averages.trend },
                  { name: 'SMA 50', val: analysis.moving_averages.sma50, sig: '—' },
                  { name: 'SMA 200', val: analysis.moving_averages.sma200 || '—', sig: '—' },
                  { name: 'Boll Upper', val: analysis.bollinger.upper, sig: '—' },
                  { name: 'Boll Middle', val: analysis.bollinger.middle, sig: '—' },
                  { name: 'Boll Lower', val: analysis.bollinger.lower, sig: '—' },
                  { name: 'Stoch %K', val: analysis.stochastic.k, sig: analysis.stochastic.k > 80 ? 'OVERBOUGHT' : analysis.stochastic.k < 20 ? 'OVERSOLD' : 'NEUTRAL' },
                  { name: 'Stoch %D', val: analysis.stochastic.d, sig: '—' },
                  { name: 'ATR', val: analysis.atr, sig: '—' },
                ].map(({ name, val, sig }) => (
                  <tr key={name}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#00e87a' }}>{name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'monospace' }}>{val}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      {sig !== '—' ? <span style={S.pill(sig)}>{sig}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade Tab */}
      {tab === 'trade' && price && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={S.card}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>💰 模擬交易</div>
            <div style={{ marginBottom: '16px' }}>
              <div style={S.label}>現價</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#00e87a' }}>TWD {price.latest_close}</div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={S.label}>股數</div>
              <input
                type="number"
                value={shares}
                onChange={e => setShares(parseInt(e.target.value) || 0)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e8edf2', fontSize: '16px', fontFamily: 'monospace', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
              <div style={S.label}>預估金額</div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>TWD {(shares * price.latest_close).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => trade('buy')}
                style={{ flex: 1, padding: '12px', background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.4)', color: '#00e87a', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700 }}>
                ▲ 買入
              </button>
              <button onClick={() => trade('sell')}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700 }}>
                ▼ 賣出
              </button>
            </div>
            {tradeMsg && (
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '12px', color: tradeMsg.includes('✅') ? '#00e87a' : '#ff4757' }}>
                {tradeMsg}
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>⚡ 策略建議</div>
            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'RSI 訊號', sig: analysis.rsi_signal, note: `RSI = ${analysis.rsi}` },
                  { label: 'MACD 訊號', sig: analysis.macd.signal, note: `MACD = ${analysis.macd.macd_line}` },
                  { label: '均線趨勢', sig: analysis.moving_averages.trend, note: `SMA20 = ${analysis.moving_averages.sma20}` },
                  { label: 'Stoch 訊號', sig: analysis.stochastic.k > 80 ? 'OVERBOUGHT' : analysis.stochastic.k < 20 ? 'OVERSOLD' : 'NEUTRAL', note: `%K = ${analysis.stochastic.k}` },
                ].map(({ label, sig, note }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{note}</div>
                    </div>
                    <span style={S.pill(sig)}>{sig}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
