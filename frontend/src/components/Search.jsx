import { useState } from 'react';

const QUICK = ['2330', '2454', '2317', '0050', '2412', '2882'];

export default function Search({ onSearch, apiStatus }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handle = (code) => {
    if (!/^\d{4}$/.test(code)) {
      setError('請輸入 4 位數股票代碼');
      return;
    }
    if (apiStatus === 'offline') {
      setError('API 目前無法連接，請稍候再試');
      return;
    }
    setError('');
    onSearch(code);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '32px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>◈</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#00e87a', letterSpacing: '4px', marginBottom: '8px' }}>TWSE 量化分析平台</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>輸入台股 4 位數代碼開始分析</div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handle(input)}
          placeholder="2330"
          maxLength={4}
          style={{ width: '140px', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,232,122,0.3)', borderRadius: '6px', color: '#e8edf2', fontSize: '20px', fontFamily: 'monospace', letterSpacing: '6px', textAlign: 'center', outline: 'none' }}
        />
        <button onClick={() => handle(input)}
          disabled={apiStatus === 'offline'}
          style={{ padding: '12px 24px', background: apiStatus === 'offline' ? 'rgba(255,255,255,0.05)' : 'rgba(0,232,122,0.15)', border: `1px solid ${apiStatus === 'offline' ? 'rgba(255,255,255,0.1)' : 'rgba(0,232,122,0.4)'}`, color: apiStatus === 'offline' ? 'rgba(255,255,255,0.2)' : '#00e87a', borderRadius: '6px', cursor: apiStatus === 'offline' ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'monospace', letterSpacing: '2px' }}>
          {apiStatus === 'checking' ? '連接中...' : apiStatus === 'offline' ? '無法連接' : '分析 ▶'}
        </button>
      </div>

      {error && <div style={{ color: '#ff4757', fontSize: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {QUICK.map(c => (
          <button key={c} onClick={() => handle(c)}
            disabled={apiStatus === 'offline'}
            style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: apiStatus === 'offline' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: apiStatus === 'offline' ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '2px' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Status hint */}
      {apiStatus === 'offline' && (
        <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '8px', maxWidth: '400px' }}>
          <div style={{ color: '#ff4757', fontSize: '12px', marginBottom: '6px', fontWeight: 700 }}>⚠ 正在等待伺服器啟動</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', lineHeight: '1.6' }}>
            伺服器可能處於休眠狀態，通常需要 30-60 秒重新啟動。系統會自動重試，請稍候。
          </div>
        </div>
      )}

      {apiStatus === 'checking' && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '1px' }}>
          正在連接伺服器...
        </div>
      )}
    </div>
  );
}
