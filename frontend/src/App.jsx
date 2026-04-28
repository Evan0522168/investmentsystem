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
  blue: '#1a3a6e',
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

  const statusConfig = {
    checking: { color: '#f0a500', bg: '#fff8e6', border: '#f0a500', text: 'Connecting...', dot: '○' },
    online:   { color: '#0a7c4e', bg: '#e6f7f1', border: '#0a7c4e', text: 'Online', dot: '●' },
    slow:     { color: '#d4720a', bg: '#fff3e6', border: '#d4720a', text: 'Slow Response', dot: '●' },
    offline:  { color: '#c0392b', bg: '#fdecea', border: '#c0392b', text: 'Offline', dot: '●' },
  }[apiStatus];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        button:hover { filter: brightness(0.95); }
      `}</style>

      {/* Header */}
      <header style={{ background: C.primary, padding: '0 32px', display: 'flex', alignItems: 'center', height: '64px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '32px' }}>
          <div style={{ color: C.accent, fontWeight: 800, fontSize: '20px', letterSpacing: '2px', lineHeight: 1.1 }}>FAST</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase' }}>Finance App for Studying & Trading</div>
        </div>

        <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.2)', marginRight: '24px' }} />

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'strategy', label: 'Strategy Center', icon: '⚡' },
            { key: 'result', label: 'Backtest Result', icon: '📊', disabled: !backtestResult },
          ].map(({ key, label, icon, disabled }) => (
            <button key={key} onClick={() => !disabled && setPage(key)} disabled={disabled}
              style={{ padding: '8px 16px', background: page === key ? 'rgba(240,165,0,0.2)' : 'transparent', border: page === key ? '1px solid rgba(240,165,0,0.6)' : '1px solid transparent', color: disabled ? 'rgba(255,255,255,0.2)' : page === key ? C.accent : 'rgba(255,255,255,0.7)', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: page === key ? 600 : 400, transition: 'all 0.15s' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: '99px', fontSize: '11px', color: statusConfig.color, fontWeight: 600 }}>
            <span style={{ animation: apiStatus === 'checking' ? 'spin 1s linear infinite' : 'none', display: 'inline-block', fontSize: '10px' }}>{statusConfig.dot}</span>
            {statusConfig.text}
          </div>
          {apiStatus === STATUS.OFFLINE && (
            <button onClick={checkApiStatus}
              style={{ padding: '5px 12px', background: '#c0392b', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
              Retry
            </button>
          )}
        </div>
      </header>

      {/* Offline Banner */}
      {apiStatus === STATUS.OFFLINE && (
        <div style={{ background: '#fdecea', borderBottom: '1px solid #f5c6c2', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#c0392b' }}>
          <span>⚠</span>
          <span>Server may be starting up. Please wait 30–60 seconds and retry.</span>
          <button onClick={checkApiStatus} style={{ marginLeft: 'auto', padding: '4px 14px', background: '#c0392b', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Retry Now</button>
        </div>
      )}

      {/* Slow Banner */}
      {apiStatus === STATUS.SLOW && (
        <div style={{ background: '#fff8e6', borderBottom: '1px solid #f0d080', padding: '8px 32px', fontSize: '11px', color: '#d4720a' }}>
          ⚡ API is responding slowly. Data loading may take longer than usual.
        </div>
      )}

      {/* Page Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>
        {page === 'strategy' && (
          <StrategyCenter apiStatus={apiStatus} onResult={handleBacktestResult} />
        )}
        {page === 'result' && backtestResult && (
          <BacktestResult result={backtestResult} onBack={() => setPage('strategy')} />
        )}
      </main>
    </div>
  );
}

"""import { useState, useEffect } from 'react';
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
    checking: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', text: 'Connecting...', icon: '⟳', anim: 'spin 1s linear infinite' },
    online:   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)', border: 'rgba(0,232,122,0.3)', text: 'API Online', icon: '●', anim: 'pulse 2s infinite' },
    slow:     { color: '#ff9f43', bg: 'rgba(255,159,67,0.1)', border: 'rgba(255,159,67,0.3)', text: 'API Slow', icon: '●', anim: 'pulse 2s infinite' },
    offline:  { color: '#ff4757', bg: 'rgba(255,71,87,0.1)',  border: 'rgba(255,71,87,0.3)',  text: 'API Offline', icon: '●', anim: 'blink 1s infinite' },
  }[apiStatus];

  return (
    <div style={{ minHeight: '100vh', background: '#050a0e', color: '#e8edf2', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
      `}</style>

      <nav style={{ background: '#0a1628', borderBottom: '1px solid rgba(0,232,122,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '56px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ color: '#00e87a', fontWeight: 700, fontSize: '18px', letterSpacing: '4px' }}>◈ QUANT LAB</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '99px', fontSize: '10px', color: sc.color }}>
          <span style={{ animation: sc.anim, display: 'inline-block', fontSize: '8px' }}>{sc.icon}</span>
          {sc.text}
        </div>

        {apiStatus === STATUS.OFFLINE && (
          <button onClick={checkApiStatus}
            style={{ padding: '4px 12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace' }}>
            Reconnect
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {[
            { key: 'strategy', label: 'Strategy Center' },
            { key: 'result', label: 'Backtest Result', disabled: !backtestResult },
          ].map(({ key, label, disabled }) => (
            <button key={key} onClick={() => !disabled && setPage(key)} disabled={disabled}
              style={{ padding: '6px 16px', background: page === key ? 'rgba(0,232,122,0.15)' : 'none', border: `1px solid ${page === key ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: disabled ? 'rgba(255,255,255,0.2)' : page === key ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '11px', letterSpacing: '1px', fontFamily: 'monospace' }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {apiStatus === STATUS.OFFLINE && (
        <div style={{ background: 'rgba(255,71,87,0.1)', borderBottom: '1px solid rgba(255,71,87,0.3)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#ff4757' }}>
          <span>⚠</span>
          <div>Server may be starting up, please wait 30-60 seconds and retry.</div>
          <button onClick={checkApiStatus} style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace' }}>Retry</button>
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
"""