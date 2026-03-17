import { useState } from 'react';
import Search from './components/Search';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import './App.css';

export default function App() {
  const [page, setPage] = useState('search');
  const [stockId, setStockId] = useState('');

  const handleSearch = (id) => {
    setStockId(id);
    setPage('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050a0e', color: '#e8edf2', fontFamily: 'monospace' }}>
      {/* Nav */}
      <nav style={{ background: '#0a1628', borderBottom: '1px solid rgba(0,232,122,0.2)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '24px', height: '56px' }}>
        <div style={{ color: '#00e87a', fontWeight: 700, fontSize: '18px', letterSpacing: '4px' }}>◈ TWSE QUANT</div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {['search', 'portfolio'].map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ padding: '6px 16px', background: page === p ? 'rgba(0,232,122,0.15)' : 'none', border: `1px solid ${page === p ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: page === p ? '#00e87a' : 'rgba(255,255,255,0.5)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {p === 'search' ? '🔍 分析' : '💼 投資組合'}
            </button>
          ))}
        </div>
      </nav>

      {/* Pages */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {page === 'search' && <Search onSearch={handleSearch} />}
        {page === 'dashboard' && stockId && <Dashboard stockId={stockId} onBack={() => setPage('search')} />}
        {page === 'portfolio' && <Portfolio />}
      </div>
    </div>
  );
}
