import { useState, useEffect } from 'react';
import StrategyCenter from './components/StrategyCenter';
import BacktestResult from './components/BacktestResult';
import { checkHealth } from './api';
import './App.css';

const STATUS = {
  CHECKING: 'checking',
  ONLINE: 'online',
  SLOW: 'slow',
  OFFLINE: 'offline',
};

export default function App() {
  const [page, setPage] = useState('strategy');
  const [backtestResult, setBacktestResult] = useState(null);
  const [apiStatus, setApiStatus] = useState(STATUS.CHECKING);

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    setApiStatus(STATUS.CHECKING);
    const start = Date.now();
    try {
      await checkHealth();
      const elapsed = Date.now() - start;
      setApiStatus(elapsed > 5000 ? STATUS.SLOW : STATUS.ONLINE);
    } catch {
      setApiStatus(STATUS.OFFLINE);
    }
  };

  const handleBacktestResult = (result) => {
    setBacktestResult(result);
    setPage('result');
  };

  const sc = {
    checking: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', text: '連接中...', icon: '⟳', anim: 'spin 1s linear infinite' },
    online:   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)', border: 'rgba(0,232,122,0.3)', text: 'API 正常', icon: '●', anim: 'pulse 2s infinite' },
    slow:     { color: '#ff9f43', bg: 'rgba(255,159,67,0.1)', border: 'rgba(255,159,67,0.3)', text: 'API 較慢', icon: '●', anim: 'pulse 2s infinite' },
    offline:  { color: '#ff4757', bg: 'rgba(255,71,87,0.1)',  border: 'rgba(255,71,87,0.3)',  text: 'API 離線', icon: '●', anim: 'blink 1s infinite' },
  }[apiStatus];

  return (
    <div style={{ minHeight: '100vh', background: '#050a0e', color: '#e8edf2', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
      `}</style>

      {/* Nav */}
      <nav style={{ background: '#0a1628', borderBottom: '1px solid rgba(0,232,122,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '56px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ color: '#00e87a', fontWeight: 700, fontSize: '18px', letterSpacing: '4px' }}>◈ QUANT LAB</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '99px', fontSize: '10px', color: sc.color }}>
          <span style={{ animation: sc.anim, display: 'inline-block', fontSize: '8px' }}>{sc.icon}</span>
          {sc.text}
        </div>

        {apiStatus === STATUS.OFFLINE && (
          <button onClick={checkApiStatus}
            style={{ padding: '4px 12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace' }}>
            重新連接
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {[
            { key: 'strategy', label: '⚡ 策略中心' },
            { key: 'result',   label: '📊 回測結果', disabled: !backtestResult },
          ].map(({ key, label, disabled }) => (
            <button key={key} onClick={() => !disabled && setPage(key)} disabled={disabled}
              style={{ padding: '6px 16px', background: page === key ? 'rgba(0,232,122,0.15)' : 'none', border: `1px solid ${page === key ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: disabled ? 'rgba(255,255,255,0.2)' : page === key ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '11px', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Offline Banner */}
      {apiStatus === STATUS.OFFLINE && (
        <div style={{ background: 'rgba(255,71,87,0.1)', borderBottom: '1px solid rgba(255,71,87,0.3)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#ff4757' }}>
          <span>⚠</span>
          <div>伺服器可能正在啟動，請稍候 30-60 秒後重試。</div>
          <button onClick={checkApiStatus} style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace' }}>立即重試</button>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {page === 'strategy' && (
          <StrategyCenter
            apiStatus={apiStatus}
            onResult={handleBacktestResult}
          />
        )}
        {page === 'result' && backtestResult && (
          <BacktestResult
            result={backtestResult}
            onBack={() => setPage('strategy')}
          />
        )}
      </div>
    </div>
  );
}