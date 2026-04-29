import { useState, useEffect } from 'react';
import { getStrategies, runBacktest, updatePrice } from '../api';

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

const SOURCES = [
  { group: 'Price', options: [
    { value: 'Close', label: 'Close Price' },
    { value: 'Open', label: 'Open Price' },
    { value: 'High', label: 'High Price' },
    { value: 'Low', label: 'Low Price' },
  ]},
  { group: 'Volume', options: [
    { value: 'Volume', label: 'Volume' },
    { value: 'Volume_Change_Pct', label: 'Volume Change %' },
  ]},
  { group: 'Moving Average', options: [
    { value: 'SMA', label: 'SMA (period)', hasPeriod: true },
    { value: 'EMA', label: 'EMA (period)', hasPeriod: true },
    { value: 'VWAP', label: 'VWAP' },
  ]},
  { group: 'Technical Indicators', options: [
    { value: 'RSI', label: 'RSI (period)', hasPeriod: true },
    { value: 'MACD_Line', label: 'MACD Line' },
    { value: 'MACD_Signal', label: 'MACD Signal' },
    { value: 'MACD_Histogram', label: 'MACD Histogram' },
    { value: 'Bollinger_Upper', label: 'Bollinger Upper', hasPeriod: true },
    { value: 'Bollinger_Middle', label: 'Bollinger Middle', hasPeriod: true },
    { value: 'Bollinger_Lower', label: 'Bollinger Lower', hasPeriod: true },
    { value: 'Stoch_K', label: 'Stochastic %K', hasPeriod: true },
    { value: 'Stoch_D', label: 'Stochastic %D', hasPeriod: true },
    { value: 'ATR', label: 'ATR (period)', hasPeriod: true },
    { value: 'Momentum', label: 'Momentum % (period)', hasPeriod: true },
    { value: 'Price_Change_Pct', label: 'Price Change % (period)', hasPeriod: true },
  ]},
  { group: 'Statistics', options: [
    { value: 'SD', label: 'Std Deviation (period)', hasPeriod: true },
    { value: 'Mean', label: 'Mean (period)', hasPeriod: true },
    { value: 'Variance', label: 'Variance (period)', hasPeriod: true },
    { value: 'ZScore', label: 'Z-Score (period)', hasPeriod: true },
    { value: 'Percentile', label: 'Percentile (period)', hasPeriod: true },
    { value: 'Skewness', label: 'Skewness (period)', hasPeriod: true },
    { value: 'Price_SD_Ratio', label: 'Price/SD Ratio (period)', hasPeriod: true },
  ]},
];

const OPERATORS = [
  { group: 'Comparison', options: [
    { value: 'greater_than', label: '> Greater than' },
    { value: 'less_than', label: '< Less than' },
    { value: 'greater_equal', label: '>= Greater or equal' },
    { value: 'less_equal', label: '<= Less or equal' },
  ]},
  { group: 'Crossover', options: [
    { value: 'cross_above', label: '↑ Crosses above' },
    { value: 'cross_below', label: '↓ Crosses below' },
  ]},
  { group: 'Change Rate', options: [
    { value: 'pct_change_greater', label: '% Change > value' },
    { value: 'pct_change_less', label: '% Change < value' },
  ]},
  { group: 'Statistical', options: [
    { value: 'above_mean_plus_sd', label: '> Mean + n×SD' },
    { value: 'below_mean_minus_sd', label: '< Mean - n×SD' },
    { value: 'zscore_greater', label: 'Z-Score > value' },
    { value: 'zscore_less', label: 'Z-Score < value' },
    { value: 'percentile_greater', label: 'Percentile > value' },
    { value: 'percentile_less', label: 'Percentile < value' },
  ]},
];

const RIGHT_TYPES = [
  { value: 'value', label: 'Fixed Value' },
  { value: 'source', label: 'Another Indicator' },
];

const defaultAdvancedRule = () => ({
  left: { source: 'RSI', period: 14 },
  operator: 'less_than',
  rightType: 'value',
  value: 30,
  right: { source: 'SMA', period: 20 },
});

const defaultDCAConfig = () => ({
  interval_days: 30,
  amount_per_trade: 10000,
});

const defaultShortConfig = () => ({
  period: 14,
  overbought: 70,
  oversold: 30,
});

export default function StrategyCenter({ apiStatus, onResult }) {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyMode, setStrategyMode] = useState('builtin');
  const [customMode, setCustomMode] = useState('technical');

  const [customName, setCustomName] = useState('My Strategy');
  const [customDesc, setCustomDesc] = useState('');
  const [buyRules, setBuyRules] = useState([defaultAdvancedRule()]);
  const [sellRules, setSellRules] = useState([defaultAdvancedRule()]);
  const [buyLogic, setBuyLogic] = useState('AND');
  const [sellLogic, setSellLogic] = useState('AND');
  const [tradeMode, setTradeMode] = useState('long');

  const [dcaConfig, setDcaConfig] = useState(defaultDCAConfig());
  const [shortConfig, setShortConfig] = useState(defaultShortConfig());

  const [market, setMarket] = useState('TWSE');
  const [symbol, setSymbol] = useState('');
  const [forexBase, setForexBase] = useState('EUR');
  const [forexQuote, setForexQuote] = useState('USD');
  const [initialCash, setInitialCash] = useState(1000000);
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (customMode === 'dca') {
      return {
        type: 'DCAStrategy',
        interval_days: dcaConfig.interval_days,
        amount_per_trade: dcaConfig.amount_per_trade,
      };
    }
    if (customMode === 'short') {
      return {
        type: 'ShortSellingStrategy',
        period: shortConfig.period,
        overbought: shortConfig.overbought,
        oversold: shortConfig.oversold,
      };
    }
    return {
      type: 'AdvancedStrategy',
      name: customName,
      description: customDesc,
      buy_rules: buyRules.map(r => ({
        left: r.left,
        operator: r.operator,
        value: r.rightType === 'value' ? r.value : 0,
        right: r.rightType === 'source' ? r.right : {},
      })),
      sell_rules: sellRules.map(r => ({
        left: r.left,
        operator: r.operator,
        value: r.rightType === 'value' ? r.value : 0,
        right: r.rightType === 'source' ? r.right : {},
      })),
      buy_logic: buyLogic,
      sell_logic: sellLogic,
      mode: tradeMode,
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
      onResult({
        ...r.data,
        symbol: sym,
        strategyName: strategyMode === 'builtin' ? selectedStrategy?.name : customName
      });
    } catch (e) {
      setError(e.response?.data?.detail || 'Backtest failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (rules, setRules, index, field, value) => {
    const updated = [...rules];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = { ...updated[index], [parent]: { ...updated[index][parent], [child]: value } };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setRules(updated);
  };

  const S = {
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: C.textDim, textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
    input: { width: '100%', padding: '9px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: '13px', outline: 'none' },
    select: { width: '100%', padding: '9px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: '13px', outline: 'none' },
    sectionTitle: { fontSize: '13px', fontWeight: 700, color: C.primary, marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${C.accent}`, display: 'inline-block' },
    modeBtn: (active) => ({ flex: 1, padding: '8px', background: active ? '#e8edf7' : C.bg, border: `1px solid ${active ? C.primary : C.border}`, color: active ? C.primary : C.textDim, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 700 : 400 }),
  };

  const SourceSelector = ({ config, onChange, label }) => {
    const allOptions = SOURCES.flatMap(g => g.options);
    const selected = allOptions.find(o => o.value === config.source) || allOptions[0];
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
        <select value={config.source} onChange={e => onChange({ ...config, source: e.target.value, period: 14 })}
          style={{ ...S.select, fontSize: '11px', padding: '6px 8px' }}>
          {SOURCES.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          ))}
        </select>
        {selected?.hasPeriod && (
          <input type="number" value={config.period || 14} onChange={e => onChange({ ...config, period: parseInt(e.target.value) })}
            style={{ ...S.input, width: '60px', fontSize: '11px', padding: '6px 8px' }} placeholder="Period" />
        )}
      </div>
    );
  };

  const AdvancedRuleEditor = ({ rules, setRules, title, color, logic, setLogic }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color }}>{title}</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: C.textDim }}>Logic:</span>
          {['AND', 'OR'].map(l => (
            <button key={l} onClick={() => setLogic(l)}
              style={{ padding: '2px 10px', background: logic === l ? color : C.bg, border: `1px solid ${logic === l ? color : C.border}`, color: logic === l ? '#fff' : C.textDim, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>
              {l}
            </button>
          ))}
          <button onClick={() => setRules([...rules, defaultAdvancedRule()])}
            style={{ padding: '3px 10px', background: color === C.green ? '#e6f7f1' : '#fdecea', border: `1px solid ${color}`, color, borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}>
            + Add
          </button>
        </div>
      </div>

      {rules.map((rule, i) => (
        <div key={i} style={{ padding: '12px', background: C.bg, borderRadius: '8px', border: `1px solid ${C.border}`, marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '160px' }}>
              <div style={{ fontSize: '9px', color: C.textDim, marginBottom: '4px', fontWeight: 700 }}>LEFT SIDE</div>
              <SourceSelector config={rule.left} onChange={v => updateRule(rules, setRules, i, 'left', v)} />
            </div>

            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '9px', color: C.textDim, marginBottom: '4px', fontWeight: 700 }}>OPERATOR</div>
              <select value={rule.operator} onChange={e => updateRule(rules, setRules, i, 'operator', e.target.value)}
                style={{ ...S.select, fontSize: '11px', padding: '6px 8px' }}>
                {OPERATORS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ flex: 2, minWidth: '160px' }}>
              <div style={{ fontSize: '9px', color: C.textDim, marginBottom: '4px', fontWeight: 700 }}>RIGHT SIDE</div>
              <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {RIGHT_TYPES.map(rt => (
                    <button key={rt.value} onClick={() => updateRule(rules, setRules, i, 'rightType', rt.value)}
                      style={{ flex: 1, padding: '4px', background: rule.rightType === rt.value ? C.primary : C.bg, border: `1px solid ${rule.rightType === rt.value ? C.primary : C.border}`, color: rule.rightType === rt.value ? '#fff' : C.textDim, borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>
                      {rt.label}
                    </button>
                  ))}
                </div>
                {rule.rightType === 'value' ? (
                  <input type="number" value={rule.value} onChange={e => updateRule(rules, setRules, i, 'value', parseFloat(e.target.value))}
                    style={{ ...S.input, fontSize: '11px', padding: '6px 8px' }} />
                ) : (
                  <SourceSelector config={rule.right} onChange={v => updateRule(rules, setRules, i, 'right', v)} />
                )}
              </div>
            </div>

            {rules.length > 1 && (
              <button onClick={() => setRules(rules.filter((_, ri) => ri !== i))}
                style={{ padding: '4px 8px', background: '#fdecea', border: `1px solid ${C.red}`, color: C.red, borderRadius: '4px', cursor: 'pointer', fontSize: '11px', alignSelf: 'flex-end' }}>
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: C.primary }}>Strategy Center</div>
        <div style={{ fontSize: '12px', color: C.textDim, marginTop: '4px' }}>Configure and run backtests on your trading strategies</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>

        {/* Left: Strategy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Strategy Selection</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[['builtin', 'Built-in'], ['custom', 'Custom']].map(([key, label]) => (
                <button key={key} onClick={() => setStrategyMode(key)} style={S.modeBtn(strategyMode === key)}>
                  {label}
                </button>
              ))}
            </div>

            {strategyMode === 'builtin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {strategies.map((s, i) => (
                  <div key={i} onClick={() => setSelectedStrategy(s)}
                    style={{ padding: '12px 14px', background: selectedStrategy?.name === s.name ? '#e8edf7' : C.bg, border: `1px solid ${selectedStrategy?.name === s.name ? C.primary : C.border}`, borderRadius: '8px', cursor: 'pointer', borderLeft: selectedStrategy?.name === s.name ? `4px solid ${C.accent}` : `4px solid transparent` }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: selectedStrategy?.name === s.name ? C.primary : C.text }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>{s.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Custom mode tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    ['technical', '📈 Technical'],
                    ['dca', '💰 DCA'],
                    ['short', '📉 Short'],
                    ['advanced', '🔓 Advanced'],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setCustomMode(key)}
                      style={{ padding: '6px 12px', background: customMode === key ? C.primary : C.bg, border: `1px solid ${customMode === key ? C.primary : C.border}`, color: customMode === key ? '#fff' : C.textDim, borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: customMode === key ? 700 : 400 }}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Technical mode */}
                {customMode === 'technical' && (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={S.label}>Strategy Name</label>
                      <input value={customName} onChange={e => setCustomName(e.target.value)} style={S.input} />
                    </div>
                    <AdvancedRuleEditor rules={buyRules} setRules={setBuyRules} title="BUY Conditions" color={C.green} logic={buyLogic} setLogic={setBuyLogic} />
                    <AdvancedRuleEditor rules={sellRules} setRules={setSellRules} title="SELL Conditions" color={C.red} logic={sellLogic} setLogic={setSellLogic} />
                  </div>
                )}

                {/* DCA mode */}
                {customMode === 'dca' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '14px', background: '#e6f7f1', border: `1px solid #a8dcc5`, borderRadius: '8px', fontSize: '12px', color: C.green }}>
                      💰 Dollar Cost Averaging — invest a fixed amount at regular intervals regardless of price.
                    </div>
                    <div>
                      <label style={S.label}>Interval (days)</label>
                      <input type="number" value={dcaConfig.interval_days}
                        onChange={e => setDcaConfig({ ...dcaConfig, interval_days: parseInt(e.target.value) })}
                        style={S.input} min={1} />
                      <div style={{ fontSize: '10px', color: C.textDim, marginTop: '4px' }}>e.g. 30 = invest every 30 days</div>
                    </div>
                    <div>
                      <label style={S.label}>Amount per Investment</label>
                      <input type="number" value={dcaConfig.amount_per_trade}
                        onChange={e => setDcaConfig({ ...dcaConfig, amount_per_trade: parseInt(e.target.value) })}
                        style={S.input} min={1} />
                      <div style={{ fontSize: '10px', color: C.textDim, marginTop: '4px' }}>Amount invested each time (in your base currency)</div>
                    </div>
                  </div>
                )}

                {/* Short mode */}
                {customMode === 'short' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '14px', background: '#fdecea', border: `1px solid #f5c6c2`, borderRadius: '8px', fontSize: '12px', color: C.red }}>
                      📉 Short Selling — profit from falling prices by shorting when overbought and covering when oversold.
                    </div>
                    <div>
                      <label style={S.label}>RSI Period</label>
                      <input type="number" value={shortConfig.period}
                        onChange={e => setShortConfig({ ...shortConfig, period: parseInt(e.target.value) })}
                        style={S.input} min={2} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={S.label}>Short when RSI &gt;</label>
                        <input type="number" value={shortConfig.overbought}
                          onChange={e => setShortConfig({ ...shortConfig, overbought: parseInt(e.target.value) })}
                          style={S.input} min={50} max={100} />
                      </div>
                      <div>
                        <label style={S.label}>Cover when RSI &lt;</label>
                        <input type="number" value={shortConfig.oversold}
                          onChange={e => setShortConfig({ ...shortConfig, oversold: parseInt(e.target.value) })}
                          style={S.input} min={0} max={50} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced mode */}
                {customMode === 'advanced' && (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={S.label}>Strategy Name</label>
                      <input value={customName} onChange={e => setCustomName(e.target.value)} style={S.input} />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={S.label}>Trade Direction</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[['long', '📈 Long (Buy/Sell)'], ['short', '📉 Short (Short/Cover)']].map(([val, label]) => (
                          <button key={val} onClick={() => setTradeMode(val)} style={S.modeBtn(tradeMode === val)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <AdvancedRuleEditor
                      rules={buyRules} setRules={setBuyRules}
                      title={tradeMode === 'long' ? 'BUY Conditions' : 'SHORT Conditions'}
                      color={C.green} logic={buyLogic} setLogic={setBuyLogic}
                    />
                    <AdvancedRuleEditor
                      rules={sellRules} setRules={setSellRules}
                      title={tradeMode === 'long' ? 'SELL Conditions' : 'COVER Conditions'}
                      color={C.red} logic={sellLogic} setLogic={setSellLogic}
                    />
                  </div>
                )}
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
                <button key={val} onClick={() => setMarket(val)} style={S.modeBtn(market === val)}>
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
                  <span style={{ color: C.textDim, fontSize: '20px' }}>/</span>
                  <input value={forexQuote} onChange={e => setForexQuote(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    placeholder="USD" maxLength={3}
                    style={{ ...S.input, width: '80px', textAlign: 'center', letterSpacing: '3px', fontSize: '15px', fontWeight: 700 }} />
                  <div style={{ padding: '6px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '11px', color: C.textDim }}>
                    {forexBase && forexQuote ? `${forexBase}${forexQuote}=X` : '---'}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: C.textDim, marginTop: '6px' }}>Type any currency codes (EUR/USD, GBP/JPY, BTC/USD...)</div>
              </div>
            )}

                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ ...S.label, marginBottom: 0 }}>From year:</label>
                <select value={startYear} onChange={e => setStartYear(parseInt(e.target.value))}
                  style={{ ...S.select, width: '90px', padding: '6px 8px', fontSize: '12px' }}>
                  {Array.from({ length: new Date().getFullYear() - 2004 }, (_, i) => 2005 + i).reverse().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
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

          <button onClick={handleRun} disabled={loading || apiStatus === 'offline'}
            style={{ padding: '14px', background: loading ? '#ccc' : C.primary, border: 'none', color: '#fff', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, boxShadow: loading ? 'none' : '0 2px 8px rgba(26,58,110,0.3)' }}>
            {loading ? '⟳ Running Backtest...' : '▶ Run Backtest'}
          </button>
        </div>
      </div>
    </div>
  );
}
