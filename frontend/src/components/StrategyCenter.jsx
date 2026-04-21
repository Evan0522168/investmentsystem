import { useState, useEffect } from 'react';
import { getStrategies, runBacktest, compareStrategies, updatePrice } from '../api';

const MARKETS = [
  { label: '台股', value: 'TWSE', placeholder: '2330', hint: '輸入4位數台股代碼' },
  { label: '外匯', value: 'FOREX', placeholder: 'EURUSD=X', hint: '例如 EURUSD=X、USDJPY=X' },
];

const FOREX_OPTIONS = [
  { label: 'EUR/USD 歐元/美元', value: 'EURUSD=X' },
  { label: 'USD/JPY 美元/日圓', value: 'USDJPY=X' },
  { label: 'GBP/USD 英鎊/美元', value: 'GBPUSD=X' },
  { label: 'USD/TWD 美元/台幣', value: 'TWD=X' },
  { label: 'AUD/USD 澳幣/美元', value: 'AUDUSD=X' },
  { label: 'USD/CNY 美元/人民幣', value: 'CNY=X' },
];

const INDICATORS = ['RSI', 'MACD', 'SMA', 'EMA', 'BOLL'];
const CONDITIONS = {
  RSI:  ['less_than', 'greater_than'],
  MACD: ['cross_above', 'cross_below', 'greater_than', 'less_than'],
  SMA:  ['less_than', 'greater_than', 'cross_above', 'cross_below'],
  EMA:  ['less_than', 'greater_than'],
  BOLL: ['cross_above', 'cross_below'],
};
const CONDITION_LABELS = {
  less_than:   '小於',
  greater_than: '大於',
  cross_above: '向上穿越',
  cross_below: '向下穿越',
};

const defaultRule = () => ({ indicator: 'RSI', condition: 'less_than', value: 30, period: 14, fast: 12, slow: 26 });

export default function StrategyCenter({ apiStatus, onResult }) {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyMode, setStrategyMode] = useState('builtin');
  const [customName, setCustomName] = useState('我的策略');
  const [customDesc, setCustomDesc] = useState('');
  const [buyRules, setBuyRules] = useState([defaultRule()]);
  const [sellRules, setSellRules] = useState([defaultRule()]);
  const [market, setMarket] = useState('TWSE');
  const [symbol, setSymbol] = useState('');
  const [forexSymbol, setForexSymbol] = useState('EURUSD=X');
  const [initialCash, setInitialCash] = useState(1000000);
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    getStrategies().then(r => setStrategies(r.data.builtin)).catch(() => {});
  }, []);

  const getSymbol = () => market === 'FOREX' ? forexSymbol : symbol;

  const updateData = async () => {
    const sym = getSymbol();
    if (!sym) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const r = await updatePrice(sym);
      setUpdateMsg(`✅ 已更新至 ${r.data.latest_date}（共 ${r.data.total_days} 筆）`);
    } catch (e) {
      setUpdateMsg('❌ 更新失敗');
    } finally {
      setUpdating(false);
      setTimeout(() => setUpdateMsg(''), 4000);
    }
  };

  const buildStrategyConfig = () => {
    if (strategyMode === 'builtin' && selectedStrategy) {
      return { type: selectedStrategy.type };
    }
    return {
      type: 'CustomStrategy',
      name: customName,
      description: customDesc,
      buy_rules: buyRules,
      sell_rules: sellRules,
    };
  };

  const handleRun = async () => {
    const sym = getSymbol();
    if (!sym) { setError('請輸入或選擇標的代碼'); return; }
    if (strategyMode === 'builtin' && !selectedStrategy) { setError('請選擇策略'); return; }
    setLoading(true);
    setError('');
    try {
      const r = await runBacktest({
        symbol: sym,
        market,
        strategy: buildStrategyConfig(),
        initial_cash: initialCash,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      onResult({ ...r.data, symbol: sym });
    } catch (e) {
      setError(e.response?.data?.detail || '回測失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    const sym = getSymbol();
    if (!sym) { setError('請輸入或選擇標的代碼'); return; }
    setComparing(true);
    setError('');
    try {
      const r = await compareStrategies({ symbol: sym, market, initial_cash: initialCash });
      onResult({ compare: true, results: r.data.results, symbol: sym });
    } catch (e) {
      setError(e.response?.data?.detail || '比較失敗，請重試');
    } finally {
      setComparing(false);
    }
  };

  const updateRule = (rules, setRules, index, field, value) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const RuleEditor = ({ rules, setRules, title, color }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color, letterSpacing: '1px', fontWeight: 700 }}>{title}</div>
        <button onClick={() => setRules([...rules, defaultRule()])}
          style={{ padding: '3px 10px', background: `${color}15`, border: `1px solid ${color}40`, color, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace' }}>
          + 新增條件
        </button>
      </div>
      {rules.map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
          <select value={rule.indicator} onChange={e => updateRule(rules, setRules, i, 'indicator', e.target.value)}
            style={{ padding: '6px', background: '#0a1628', border: '1px solid rgba(255,255,255,0.15)', color: '#e8edf2', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
            {INDICATORS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>

          <select value={rule.condition} onChange={e => updateRule(rules, setRules, i, 'condition', e.target.value)}
            style={{ padding: '6px', background: '#0a1628', border: '1px solid rgba(255,255,255,0.15)', color: '#e8edf2', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
            {(CONDITIONS[rule.indicator] || []).map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
          </select>

          {['less_than', 'greater_than'].includes(rule.condition) && (
            <input type="number" value={rule.value} onChange={e => updateRule(rules, setRules, i, 'value', parseFloat(e.target.value))}
              style={{ width: '70px', padding: '6px', background: '#0a1628', border: '1px solid rgba(255,255,255,0.15)', color: '#e8edf2', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }} />
          )}

          {['RSI', 'SMA', 'EMA', 'BOLL'].includes(rule.indicator) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>週期</span>
              <input type="number" value={rule.period} onChange={e => updateRule(rules, setRules, i, 'period', parseInt(e.target.value))}
                style={{ width: '55px', padding: '6px', background: '#0a1628', border: '1px solid rgba(255,255,255,0.15)', color: '#e8edf2', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }} />
            </div>
          )}

          {rules.length > 1 && (
            <button onClick={() => setRules(rules.filter((_, ri) => ri !== i))}
              style={{ padding: '4px 8px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace', marginLeft: 'auto' }}>
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const S = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '20px' },
    label: { fontSize: '9px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e8edf2', fontSize: '13px', fontFamily: 'monospace', outline: 'none' },
    select: { width: '100%', padding: '10px 12px', background: '#0a1628', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e8edf2', fontSize: '13px', fontFamily: 'monospace', outline: 'none' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#00e87a', letterSpacing: '3px' }}>⚡ 策略中心</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* 左側：策略選擇 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.card}>
            <div style={S.label}>策略模式</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[['builtin', '內建策略'], ['custom', '自訂策略']].map(([key, label]) => (
                <button key={key} onClick={() => setStrategyMode(key)}
                  style={{ flex: 1, padding: '8px', background: strategyMode === key ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${strategyMode === key ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: strategyMode === key ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace' }}>
                  {label}
                </button>
              ))}
            </div>

            {strategyMode === 'builtin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {strategies.map((s, i) => (
                  <div key={i} onClick={() => setSelectedStrategy(s)}
                    style={{ padding: '12px', background: selectedStrategy?.name === s.name ? 'rgba(0,232,122,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedStrategy?.name === s.name ? 'rgba(0,232,122,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '3px', color: selectedStrategy?.name === s.name ? '#00e87a' : '#e8edf2' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={S.label}>策略名稱</div>
                  <input value={customName} onChange={e => setCustomName(e.target.value)} style={S.input} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={S.label}>描述</div>
                  <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} style={S.input} placeholder="選填" />
                </div>
                <RuleEditor rules={buyRules} setRules={setBuyRules} title="買入條件（所有條件同時成立）" color="#00e87a" />
                <RuleEditor rules={sellRules} setRules={setSellRules} title="賣出條件（所有條件同時成立）" color="#ff4757" />
              </div>
            )}
          </div>
        </div>

        {/* 右側：回測設定 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.card}>
            <div style={S.label}>測試標的</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {MARKETS.map(m => (
                <button key={m.value} onClick={() => setMarket(m.value)}
                  style={{ flex: 1, padding: '8px', background: market === m.value ? 'rgba(0,232,122,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${market === m.value ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: market === m.value ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {market === 'TWSE' ? (
              <div>
                <div style={S.label}>股票代碼</div>
                <input value={symbol} onChange={e => setSymbol(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="例如 2330" maxLength={4} style={S.input} />
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>輸入 4 位數台股代碼</div>
              </div>
            ) : (
              <div>
                <div style={S.label}>貨幣對</div>
                <select value={forexSymbol} onChange={e => setForexSymbol(e.target.value)} style={S.select}>
                  {FOREX_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={updateData} disabled={updating || !getSymbol()}
                style={{ padding: '6px 14px', background: 'rgba(77,184,255,0.1)', border: '1px solid rgba(77,184,255,0.3)', color: '#4db8ff', borderRadius: '4px', cursor: updating || !getSymbol() ? 'not-allowed' : 'pointer', fontSize: '10px', fontFamily: 'monospace', opacity: !getSymbol() ? 0.4 : 1 }}>
                {updating ? '更新中...' : '⟳ 更新最新資料'}
              </button>
              {updateMsg && <div style={{ fontSize: '10px', color: updateMsg.includes('✅') ? '#00e87a' : '#ff4757' }}>{updateMsg}</div>}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.label}>回測期間</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={S.label}>開始日期</div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.input} />
              </div>
              <div>
                <div style={S.label}>結束日期（空白=今天）</div>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.input} />
              </div>
            </div>
            <div>
              <div style={S.label}>起始資金（TWD）</div>
              <input type="number" value={initialCash} onChange={e => setInitialCash(parseInt(e.target.value))} style={S.input} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '6px', color: '#ff4757', fontSize: '12px' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleRun} disabled={loading || apiStatus === 'offline'}
              style={{ flex: 2, padding: '14px', background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(0,232,122,0.15)', border: `1px solid ${loading ? 'rgba(255,255,255,0.1)' : 'rgba(0,232,122,0.4)'}`, color: loading ? 'rgba(255,255,255,0.3)' : '#00e87a', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px' }}>
              {loading ? '⟳ 回測中...' : '▶ 執行回測'}
            </button>
            <button onClick={handleCompare} disabled={comparing || apiStatus === 'offline'}
              style={{ flex: 1, padding: '14px', background: comparing ? 'rgba(255,255,255,0.05)' : 'rgba(77,184,255,0.1)', border: `1px solid ${comparing ? 'rgba(255,255,255,0.1)' : 'rgba(77,184,255,0.3)'}`, color: comparing ? 'rgba(255,255,255,0.3)' : '#4db8ff', borderRadius: '6px', cursor: comparing ? 'not-allowed' : 'pointer', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {comparing ? '比較中...' : '⇄ 比較所有策略'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
