import { useState, useEffect } from 'react';
import Search from './components/Search';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import { checkHealth } from './api';
import './App.css';

const STATUS = {
  CHECKING: 'checking',
  ONLINE: 'online',
  SLOW: 'slow',
  OFFLINE: 'offline',
};

export default function App() {
  const [page, setPage] = useState('search');
  const [stockId, setStockId] = useState('');
  const [apiStatus, setApiStatus] = useState(STATUS.CHECKING);
  const [checkCount, setCheckCount] = useState(0);

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
      if (elapsed > 5000) {
        setApiStatus(STATUS.SLOW);
      } else {
        setApiStatus(STATUS.ONLINE);
      }
    } catch {
      setApiStatus(STATUS.OFFLINE);
    }
    setCheckCount(c => c + 1);
  };

  const handleSearch = (id) => {
    setStockId(id);
    setPage('dashboard');
  };

  const statusConfig = {
    [STATUS.CHECKING]: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)', dot: '#ffd700', text: '檢查中...', icon: '⟳' },
    [STATUS.ONLINE]:   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)', border: 'rgba(0,232,122,0.3)', dot: '#00e87a', text: 'API 正常運行', icon: '●' },
    [STATUS.SLOW]:     { color: '#ff9f43', bg: 'rgba(255,159,67,0.1)', border: 'rgba(255,159,67,0.3)', dot: '#ff9f43', text: 'API 回應較慢', icon: '●' },
    [STATUS.OFFLINE]:  { color: '#ff4757', bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.3)', dot: '#ff4757', text: 'API 無回應，重試中...', icon: '●' },
  };

  const sc = statusConfig[apiStatus];

  return (
    <div style={{ minHeight: '100vh', background: '#050a0e', color: '#e8edf2', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      `}</style>

      {/* Nav */}
      <nav style={{ background: '#0a1628', borderBottom: '1px solid rgba(0,232,122,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', height: '56px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ color: '#00e87a', fontWeight: 700, fontSize: '18px', letterSpacing: '4px' }}>◈ TWSE QUANT</div>

        {/* API Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '99px', fontSize: '10px', color: sc.color, letterSpacing: '1px' }}>
          <span style={{
            fontSize: '8px',
            animation: apiStatus === STATUS.CHECKING ? 'spin 1s linear infinite' : apiStatus === STATUS.OFFLINE ? 'blink 1s infinite' : 'pulse 2s infinite',
            display: 'inline-block'
          }}>{sc.icon}</span>
          {sc.text}
        </div>

        {/* Retry button when offline */}
        {apiStatus === STATUS.OFFLINE && (
          <button onClick={checkApiStatus}
            style={{ padding: '4px 12px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '1px' }}>
            重新連接
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {['search', 'portfolio'].map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ padding: '6px 16px', background: page === p ? 'rgba(0,232,122,0.15)' : 'none', border: `1px solid ${page === p ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: page === p ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {p === 'search' ? '🔍 分析' : '💼 投資組合'}
            </button>
          ))}
        </div>
      </nav>

      {/* Offline Banner */}
      {apiStatus === STATUS.OFFLINE && (
        <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#ff4757' }}>
          <span style={{ fontSize: '16px' }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>API 目前無法連接</div>
            <div style={{ color: 'rgba(255,71,87,0.7)', fontSize: '11px' }}>後端伺服器可能正在啟動，請稍候 30-60 秒後重試。系統每 30 秒自動重新檢查。</div>
          </div>
          <button onClick={checkApiStatus}
            style={{ marginLeft: 'auto', padding: '6px 16px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff4757', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace' }}>
            立即重試
          </button>
        </div>
      )}

      {/* Slow Banner */}
      {apiStatus === STATUS.SLOW && (
        <div style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.3)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#ff9f43' }}>
          <span>⚡</span>
          <div>API 回應較慢，資料載入可能需要較長時間，請耐心等候。</div>
        </div>
      )}

      {/* Pages */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {page === 'search' && (
          <Search
            onSearch={handleSearch}
            apiStatus={apiStatus}
          />
        )}
        {page === 'dashboard' && stockId && (
          <Dashboard
            stockId={stockId}
            onBack={() => setPage('search')}
          />
        )}
        {page === 'portfolio' && <Portfolio />}
      </div>
    </div>
  );
}
