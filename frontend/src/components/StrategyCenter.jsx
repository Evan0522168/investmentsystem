import { useState, useEffect } from 'react';
import { getStrategies, runBacktest, compareStrategies, updatePrice } from '../api';

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

const INDICATORS = ['RSI', 'MACD', 'SMA', 'EMA', 'BOLL'];
const CONDITIONS = {
  RSI:  ['less_than', 'greater_than'],
  MACD: ['cross_above', 'cross_below', 'greater_than', 'less_than'],
  SMA:  ['less_than', 'greater_than', 'cross_above', 'cross_below'],
  EMA:  ['less_than', 'greater_than'],
  BOLL: ['cross_above', 'cross_below'],
};
const CONDITION_LABELS = {
  less_than: 'Less than',
  greater_than: 'Greater than',
  cross_above: 'Crosses above',
  cross_below: 'Crosses below',
};

const defaultRule = () => ({ indicator: 'RSI', condition: 'less_than', value: 30, period: 14, fast: 12, slow: 26 });

export default function StrategyCenter({ apiStatus, onResult }) {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyMode, setStrategyMode] = useState('builtin');
  const [customName, setCustomName] = useState('My Strategy');
  const [customDesc, setCustomDesc] = useState('');
  const [buyRules, setBuyRules] = useState([defaultRule()]);
  const [sellRules, setSellRules] = useState([defaultRule()]);
  const [market, setMarket] = useState('TWSE');
  const [symbol, setSymbol] = useState('');
  const [forexBase, setForexBase] = useState('EUR');
  const [forexQuote, setForexQuote] = useState('USD');
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

  const getSymbol = () => market === 'FOREX' ? `${forexBase}${forexQuote}=X` : symbol;

  const updateData = async () => {
    const sym = getSymbol();
    if (!sym) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const r = await updatePrice(sym);
      setUpdateMsg(`Updated to ${r.data.latest_date} (${r.data.total_days} records)`);
    } catch {
      setUpdateMsg('Update failed');
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
    if (!sym) { setError('Please enter a symbol'); return; }
    if (strategyMode === 'builtin' && !selectedStrategy) { setError('Please select a strategy'); return; }
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
      onResult({ ...r.data, symbol: sym, strategyName: selectedStrategy?.name || customName });
    } catch (e) {
      setError(e.response?.data?.detail || 'Backtest failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    const sym = getSymbol();
    if (!sym) { setError('Please enter a symbol'); return; }
    setComparing(true);
    setError('');
    try {
      const r = await compareStrategies({ symbol: sym, market, initial_cash: initialCash });
      onResult({ compare: true, results: r.data.results, symbol: sym });
    } catch (e) {
      setError(e.response?.data?.detail || 'Compare failed. Please retry.');
    } finally {
      setComparing(false);
    }
  };

  const updateRule = (rules, setRules, index, field, value) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const S = {
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: C.textDim, textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
    input: { width: '100%', padding: '9px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: '13px', outline: 'none' },
    select: { width: '100%', padding: '9px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: '13px', outline: 'none' },
    sectionTitle: { fontSize: '13px', fontWeight: 700, color: C.primary, marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${C.accent}`, display: 'inline-block' },
  };

  const RuleEditor = ({ rules, setRules, title, color }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color }}>{title}</div>
        <button onClick={() => setRules([...rules, defaultRule()])}
          style={{ padding: '3px 10px', background: color === C.green ? '#e6f7f1' : '#fdecea', border: `1px solid ${color}`, color, borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
          + Add
        </button>
      </div>
      {rules.map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '10px', background: C.bg, borderRadius: '6px', border: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <select value={rule.indicator} onChange={e => updateRule(rules, setRules, i, 'indicator', e.target.value)}
            style={{ ...S.select, width: '90px' }}>
            {INDICATORS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
          <select value={rule.condition} onChange={e => updateRule(rules, setRules, i, 'condition', e.target.value)}
            style={{ ...S.select, width: '140px' }}>
            {(CONDITIONS[rule.indicator] || []).map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
          </select>
          {['less_than', 'greater_than'].includes(rule.condition) && (
            <input type="number" value={rule.value} onChange={e => updateRule(rules, setRules, i, 'value', parseFloat(e.target.value))}
              style={{ ...S.input, width: '70px' }} />
          )}
          {['RSI', 'SMA', 'EMA', 'BOLL'].includes(rule.indicator) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: C.textDim }}>Period</span>
              <input type="number" value={rule.period} onChange={e => updateRule(rules, setRules, i, 'period', parseInt(e.target.value))}
                style={{ ...S.input, width: '60px' }} />
            </div>
          )}
          {rules.length > 1 && (
            <button onClick={() => setRules(rules.filter((_, ri) => ri !== i))}
              style={{ padding: '4px 8px', background: '#fdecea', border: `1px solid ${C.red}`, color: C.red, borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginLeft: 'auto' }}>
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: C.primary, letterSpacing: '1px' }}>Strategy Center</div>
        <div style={{ fontSize: '12px', color: C.textDim, marginTop: '4px' }}>Configure and run backtests on your trading strategies</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>

        {/* Left: Strategy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Strategy Selection</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[['builtin', 'Built-in Strategies'], ['custom', 'Custom Strategy']].map(([key, label]) => (
                <button key={key} onClick={() => setStrategyMode(key)}
                  style={{ flex: 1, padding: '8px', background: strategyMode === key ? '#e8edf7' : C.bg, border: `1px solid ${strategyMode === key ? C.primary : C.border}`, color: strategyMode === key ? C.primary : C.textDim, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: strategyMode === key ? 700 : 400 }}>
                  {label}
                </button>
              ))}
            </div>

            {strategyMode === 'builtin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {strategies.map((s, i) => (
                  <div key={i} onClick={() => setSelectedStrategy(s)}
                    style={{ padding: '12px 14px', background: selectedStrategy?.name === s.name ? '#e8edf7' : C.bg, border: `1px solid ${selectedStrategy?.name === s.name ? C.primary : C.border}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', borderLeft: selectedStrategy?.name === s.name ? `4px solid ${C.accent}` : `4px solid transparent` }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStrategy?.name === s.name ? C.primary : C.text }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={S.label}>Strategy Name</label>
                  <input value={customName} onChange={e => setCustomName(e.target.value)} style={S.input} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={S.label}>Description (optional)</label>
                  <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} style={S.input} />
                </div>
                <RuleEditor rules={buyRules} setRules={setBuyRules} title="BUY Conditions (all must be true)" color={C.green} />
                <RuleEditor rules={sellRules} setRules={setSellRules} title="SELL Conditions (all must be true)" color={C.red} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Target Asset</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[['TWSE', 'Taiwan Stock'], ['FOREX', 'Forex']].map(([val, label]) => (
                <button key={val} onClick={() => setMarket(val)}
                  style={{ flex: 1, padding: '8px', background: market === val ? '#e8edf7' : C.bg, border: `1px solid ${market === val ? C.primary : C.border}`, color: market === val ? C.primary : C.textDim, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: market === val ? 700 : 400 }}>
                  {label}
                </button>
              ))}
            </div>

            {market === 'TWSE' ? (
              <div>
                <label style={S.label}>Stock Code</label>
                <input value={symbol} onChange={e => setSymbol(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 2330" maxLength={4} style={S.input} />
                <div style={{ fontSize: '10px', color: C.textDim, marginTop: '4px' }}>Enter 4-digit TWSE stock code</div>
              </div>
            ) : (
              <div>
                <label style={S.label}>Currency Pair</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input value={forexBase} onChange={e => setForexBase(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    placeholder="EUR" maxLength={3}
                    style={{ ...S.input, width: '80px', textAlign: 'center', letterSpacing: '3px', fontSize: '15px', fontWeight: 700 }} />
                  <span style={{ color: C.textDim, fontSize: '20px', fontWeight: 300 }}>/</span>
                  <input value={forexQuote} onChange={e => setForexQuote(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    placeholder="USD" maxLength={3}
                    style={{ ...S.input, width: '80px', textAlign: 'center', letterSpacing: '3px', fontSize: '15px', fontWeight: 700 }} />
                  <div style={{ padding: '6px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '11px', color: C.textDim, whiteSpace: 'nowrap' }}>
                    {forexBase && forexQuote ? `${forexBase}${forexQuote}=X` : '---'}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: C.textDim, marginTop: '6px' }}>Type any currency codes (EUR/USD, GBP/JPY, BTC/USD...)</div>
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={updateData} disabled={updating || !getSymbol()}
                style={{ padding: '6px 14px', background: '#e8edf7', border: `1px solid ${C.primary}`, color: C.primary, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, opacity: !getSymbol() ? 0.4 : 1 }}>
                {updating ? 'Updating...' : '⟳ Refresh Data'}
              </button>
              {updateMsg && <div style={{ fontSize: '11px', color: updateMsg.includes('Updated') ? C.green : C.red }}>{updateMsg}</div>}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Backtest Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={S.label}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>End Date (blank = today)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.input} />
              </div>
            </div>
            <div>
              <label style={S.label}>Initial Capital</label>
              <input type="number" value={initialCash} onChange={e => setInitialCash(parseInt(e.target.value))} style={S.input} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#fdecea', border: `1px solid ${C.red}`, borderRadius: '6px', color: C.red, fontSize: '12px', fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleRun} disabled={loading || apiStatus === 'offline'}
              style={{ flex: 2, padding: '13px', background: loading ? '#ccc' : C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', boxShadow: loading ? 'none' : '0 2px 8px rgba(26,58,110,0.3)' }}>
              {loading ? '⟳ Running...' : '▶ Run Backtest'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
