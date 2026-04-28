import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Bar, ComposedChart, Area } from 'recharts';
import { saveToSheets } from '../api';

const C = {
  primary: '#1a3a6e',
  accent: '#f0a500',
  bg: '#f4f6fb',
  surface: '#ffffff',
  border: '#dde3ee',
  text: '#1a2340',
  textDim: '#6b7a99',
  green: '#0a7c4e',
  red: '#c0392b',
};

function calcSMA(data, period, key = 'price') {
  return data.map((d, i) => {
    if (i < period - 1) return { ...d, [`sma${period}`]: null };
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((a, b) => a + (b[key] || 0), 0) / period;
    return { ...d, [`sma${period}`]: +avg.toFixed(4) };
  });
}

export default function BacktestResult({ result, onBack }) {
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showAsset, setShowAsset] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [showBuySell, setShowBuySell] = useState(true);
  const [smaLines, setSmaLines] = useState([
    { period: 20, color: '#f0a500', enabled: true },
    { period: 50, color: '#1a3a6e', enabled: true },
  ]);
  const [newSmaPeriod, setNewSmaPeriod] = useState('');

  const isCompare = result.compare;

  const chartData = useMemo(() => {
    if (!result.daily_values) return [];
    let data = result.daily_values.map(d => ({
      date: d.date,
      asset: d.value,
      price: d.price,
      volume: d.volume || null,
    }));
    smaLines.forEach(({ period }) => {
      data = calcSMA(data, period, 'price');
    });
    if (result.trade_log) {
      result.trade_log.forEach(t => {
        const idx = data.findIndex(d => d.date === t.date);
        if (idx >= 0) {
          data[idx].buySignal = t.action === 'BUY' ? t.price : undefined;
          data[idx].sellSignal = t.action === 'SELL' ? t.price : undefined;
        }
      });
    }
    return data;
  }, [result, smaLines]);

  const addSma = () => {
    const p = parseInt(newSmaPeriod);
    if (!p || p < 2 || p > 500) return;
    if (smaLines.find(s => s.period === p)) return;
    const colors = ['#e74c3c', '#8e44ad', '#16a085', '#d35400', '#2980b9'];
    setSmaLines([...smaLines, { period: p, color: colors[smaLines.length % colors.length], enabled: true }]);
    setNewSmaPeriod('');
  };

  const toggleSma = (period) => {
    setSmaLines(smaLines.map(s => s.period === period ? { ...s, enabled: !s.enabled } : s));
  };

  const removeSma = (period) => {
    setSmaLines(smaLines.filter(s => s.period !== period));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const ok = await saveToSheets(result, result.symbol, result.strategyName || result.strategy || 'Unknown');
    setSaveMsg(ok ? 'Saved to Google Sheets' : 'Save failed');
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const S = {
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: C.textDim, textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
    sectionTitle: { fontSize: '13px', fontWeight: 700, color: C.primary, marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${C.accent}`, display: 'inline-block' },
    statCard: (positive) => ({
      background: positive === null ? C.surface : positive ? '#e6f7f1' : '#fdecea',
      border: `1px solid ${positive === null ? C.border : positive ? '#a8dcc5' : '#f5c6c2'}`,
      borderRadius: '8px', padding: '16px', textAlign: 'center'
    }),
    checkbox: { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: C.text, userSelect: 'none', padding: '4px 0' },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}>
        <div style={{ fontWeight: 700, color: C.primary, marginBottom: '6px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: '2px' }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{ padding: '7px 16px', background: C.bg, border: `1px solid ${C.border}`, color: C.textDim, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: C.primary }}>
            Backtest Result — {result.symbol}
          </div>
          {!isCompare && (
            <div style={{ fontSize: '12px', color: C.textDim, marginTop: '2px' }}>
              Strategy: {result.strategyName || result.strategy}
            </div>
          )}
        </div>
        {!isCompare && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveMsg && <div style={{ fontSize: '11px', color: saveMsg.includes('Saved') ? C.green : C.red, fontWeight: 600 }}>{saveMsg}</div>}
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 18px', background: saving ? '#ccc' : C.accent, border: 'none', color: '#fff', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 6px rgba(240,165,0,0.3)' }}>
              {saving ? 'Saving...' : '📊 Save to Google Sheets'}
            </button>
          </div>
        )}
      </div>

      {isCompare ? (
        <div style={S.card}>
          <div style={S.sectionTitle}>Strategy Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f0f3fa' }}>
                {['Rank', 'Strategy', 'Return', 'Sharpe', 'Max DD', 'Win Rate', 'Trades'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.primary, fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.results.map((r, i) => (
                <tr key={i} style={{ background: i === 0 ? '#e6f7f1' : i % 2 === 0 ? C.bg : C.surface }}>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, color: i === 0 ? C.accent : C.textDim, fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: i === 0 ? C.primary : C.text }}>{r.strategy}</td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, color: r.total_return >= 0 ? C.green : C.red, fontWeight: 700 }}>
                    {r.total_return >= 0 ? '+' : ''}{r.total_return}%
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, color: r.sharpe >= 1 ? C.green : r.sharpe >= 0 ? C.text : C.red }}>{r.sharpe}</td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, color: C.red }}>{r.max_drawdown}%</td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, color: r.win_rate >= 50 ? C.green : C.red }}>{r.win_rate}%</td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>{r.total_trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {[
              { label: 'Total Return', val: `${result.total_return >= 0 ? '+' : ''}${result.total_return}%`, positive: result.total_return >= 0 },
              { label: 'Sharpe Ratio', val: result.sharpe, positive: result.sharpe >= 1 ? true : result.sharpe >= 0 ? null : false },
              { label: 'Max Drawdown', val: `${result.max_drawdown}%`, positive: false },
              { label: 'Win Rate', val: `${result.win_rate}%`, positive: result.win_rate >= 50 },
            ].map(({ label, val, positive }) => (
              <div key={label} style={S.statCard(positive)}>
                <label style={S.label}>{label}</label>
                <div style={{ fontSize: '26px', fontWeight: 800, color: positive === null ? C.text : positive ? C.green : C.red }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Initial Capital', val: `$${result.initial_cash?.toLocaleString()}`, positive: null },
              { label: 'Final Value', val: `$${result.final_value?.toLocaleString()}`, positive: result.final_value >= result.initial_cash },
              { label: 'Total Trades', val: result.total_trades, positive: null },
            ].map(({ label, val, positive }) => (
              <div key={label} style={S.statCard(positive)}>
                <label style={S.label}>{label}</label>
                <div style={{ fontSize: '20px', fontWeight: 700, color: positive === null ? C.primary : positive ? C.green : C.red }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Chart + Controls */}
          {chartData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '16px' }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Performance Chart</div>

                {/* Asset Value */}
                {showAsset && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '4px', fontWeight: 600 }}>ASSET VALUE</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={Math.floor(chartData.length / 6)} />
                        <YAxis tick={{ fill: C.textDim, fontSize: 9 }} domain={['auto', 'auto']} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={55} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={result.initial_cash} stroke={C.textDim} strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="asset" stroke={C.primary} fill="#e8edf7" strokeWidth={2} dot={false} name="Asset Value" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Price + SMA + Buy/Sell */}
                {showPrice && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '4px', fontWeight: 600 }}>STOCK PRICE</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={Math.floor(chartData.length / 6)} />
                        <YAxis tick={{ fill: C.textDim, fontSize: 9 }} domain={['auto', 'auto']} width={55} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="price" stroke="#4a6fa5" strokeWidth={1.5} dot={false} name="Price" />
                        {smaLines.filter(s => s.enabled).map(s => (
                          <Line key={s.period} type="monotone" dataKey={`sma${s.period}`} stroke={s.color} strokeWidth={1.2} dot={false} strokeDasharray="5 3" name={`SMA${s.period}`} />
                        ))}
                        {showBuySell && (
                          <>
                            <Line type="monotone" dataKey="buySignal" stroke={C.green} dot={{ fill: C.green, r: 5 }} strokeWidth={0} name="BUY" connectNulls={false} />
                            <Line type="monotone" dataKey="sellSignal" stroke={C.red} dot={{ fill: C.red, r: 5, shape: 'triangle' }} strokeWidth={0} name="SELL" connectNulls={false} />
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Volume */}
                {showVolume && (
                  <div>
                    <div style={{ fontSize: '10px', color: C.textDim, marginBottom: '4px', fontWeight: 600 }}>VOLUME</div>
                    <ResponsiveContainer width="100%" height={80}>
                      <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <XAxis dataKey="date" tick={false} />
                        <YAxis tick={{ fill: C.textDim, fontSize: 8 }} width={55} />
                        <Bar dataKey="volume" fill="#4a6fa5" opacity={0.5} name="Volume" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={S.card}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: C.primary, marginBottom: '12px', borderBottom: `2px solid ${C.accent}`, paddingBottom: '6px' }}>Chart Display</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '14px' }}>
                    {[
                      { label: 'Asset Value', state: showAsset, set: setShowAsset, color: C.primary },
                      { label: 'Stock Price', state: showPrice, set: setShowPrice, color: '#4a6fa5' },
                      { label: 'Volume', state: showVolume, set: setShowVolume, color: '#6b7a99' },
                      { label: 'Buy/Sell Points', state: showBuySell, set: setShowBuySell, color: C.green },
                    ].map(({ label, state, set, color }) => (
                      <label key={label} style={S.checkbox} onClick={() => set(!state)}>
                        <div style={{ width: '16px', height: '16px', border: `2px solid ${state ? color : C.border}`, borderRadius: '3px', background: state ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {state && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ color: state ? C.text : C.textDim }}>{label}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 700, color: C.primary, marginBottom: '8px' }}>SMA Lines</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    {smaLines.map(s => (
                      <div key={s.period} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ ...S.checkbox, flex: 1 }} onClick={() => toggleSma(s.period)}>
                          <div style={{ width: '16px', height: '16px', border: `2px solid ${s.enabled ? s.color : C.border}`, borderRadius: '3px', background: s.enabled ? s.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.enabled && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ color: s.enabled ? C.text : C.textDim }}>SMA {s.period}</span>
                        </label>
                        <button onClick={() => removeSma(s.period)}
                          style={{ padding: '2px 6px', background: '#fdecea', border: `1px solid ${C.red}`, color: C.red, borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="number" value={newSmaPeriod} onChange={e => setNewSmaPeriod(e.target.value)}
                      placeholder="Period" min={2} max={500}
                      style={{ flex: 1, padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '4px', fontSize: '11px', color: C.text, outline: 'none' }} />
                    <button onClick={addSma}
                      style={{ padding: '6px 10px', background: C.primary, border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Log */}
          {result.trade_log?.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Trade Log (Last 20)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f0f3fa' }}>
                    {['Date', 'Action', 'Price', 'Shares', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.primary, fontSize: '11px', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.trade_log.slice(-20).reverse().map((t, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.bg : C.surface }}>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, color: C.textDim }}>{t.date}</td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: t.action === 'BUY' ? '#e6f7f1' : '#fdecea', color: t.action === 'BUY' ? C.green : C.red, border: `1px solid ${t.action === 'BUY' ? '#a8dcc5' : '#f5c6c2'}` }}>
                          {t.action}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, fontFamily: 'monospace', fontWeight: 600 }}>{t.price}</td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}` }}>{t.shares?.toLocaleString()}</td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid ${C.border}`, fontFamily: 'monospace' }}>${t.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
