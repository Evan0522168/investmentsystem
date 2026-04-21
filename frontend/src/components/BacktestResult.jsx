import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

export default function BacktestResult({ result, onBack }) {
  const S = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' },
    label: { fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' },
  };

  const isCompare = result.compare;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack}
          style={{ padding: '6px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>
          ← 返回
        </button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#00e87a', letterSpacing: '2px' }}>
          📊 回測結果 — {result.symbol}
        </div>
      </div>

      {isCompare ? (
        /* 比較模式 */
        <div style={S.card}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>⇄ 策略比較</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>{['排名', '策略', '總報酬', 'Sharpe', '最大回撤', '勝率', '交易次數'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '1.5px' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {result.results.map((r, i) => (
                <tr key={i} style={{ background: i === 0 ? 'rgba(0,232,122,0.04)' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: i === 0 ? '#ffd700' : 'rgba(255,255,255,0.4)', fontWeight: i === 0 ? 700 : 400 }}>#{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: i === 0 ? '#00e87a' : '#e8edf2', fontWeight: 600 }}>{r.strategy}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: r.total_return >= 0 ? '#00e87a' : '#ff4757', fontWeight: 700 }}>
                    {r.total_return >= 0 ? '+' : ''}{r.total_return}%
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: r.sharpe >= 1 ? '#00e87a' : r.sharpe >= 0 ? '#ffd700' : '#ff4757' }}>{r.sharpe}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#ff4757' }}>{r.max_drawdown}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: r.win_rate >= 50 ? '#00e87a' : '#ff4757' }}>{r.win_rate}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.total_trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 單一策略模式 */
        <>
          {/* 統計卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: '總報酬率', val: `${result.total_return >= 0 ? '+' : ''}${result.total_return}%`, color: result.total_return >= 0 ? '#00e87a' : '#ff4757' },
              { label: 'Sharpe Ratio', val: result.sharpe, color: result.sharpe >= 1 ? '#00e87a' : result.sharpe >= 0 ? '#ffd700' : '#ff4757' },
              { label: '最大回撤', val: `${result.max_drawdown}%`, color: '#ff4757' },
              { label: '勝率', val: `${result.win_rate}%`, color: result.win_rate >= 50 ? '#00e87a' : '#ffd700' },
            ].map(({ label, val, color }) => (
              <div key={label} style={S.card}>
                <div style={S.label}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: '起始資金', val: `$${result.initial_cash?.toLocaleString()}`, color: '#e8edf2' },
              { label: '最終資產', val: `$${result.final_value?.toLocaleString()}`, color: result.final_value >= result.initial_cash ? '#00e87a' : '#ff4757' },
              { label: '總交易次數', val: result.total_trades, color: '#4db8ff' },
            ].map(({ label, val, color }) => (
              <div key={label} style={S.card}>
                <div style={S.label}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* 資產曲線 */}
          {result.daily_values?.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>▲ 資產曲線</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={result.daily_values}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={Math.floor(result.daily_values.length / 6)} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} domain={['auto', 'auto']} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,232,122,0.3)', borderRadius: '6px', color: '#e8edf2', fontSize: '11px' }}
                    formatter={v => [`$${v.toLocaleString()}`, '資產']} />
                  <ReferenceLine y={result.initial_cash} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="value" stroke={result.total_return >= 0 ? '#00e87a' : '#ff4757'} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 交易紀錄 */}
          {result.trade_log?.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>◎ 交易紀錄（最近 20 筆）</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>{['日期', '操作', '價格', '股數', '金額'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '1.5px' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.trade_log.slice(-20).reverse().map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t.date}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: t.action === 'BUY' ? 'rgba(0,232,122,0.15)' : 'rgba(255,71,87,0.15)', color: t.action === 'BUY' ? '#00e87a' : '#ff4757' }}>
                          {t.action === 'BUY' ? '買入' : '賣出'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'monospace' }}>{t.price}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{t.shares}</td>
                      <td style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: 'monospace' }}>${t.amount?.toLocaleString()}</td>
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
