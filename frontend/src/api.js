import axios from 'axios';

const BASE = 'https://investment-system-1w3q.onrender.com';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz293vF6iB0xfOGeob1aCZSZRIr5UCtaY7L-dVt5S_47q9Nv9vRie7YClzxJifA6d1D/exec';

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config._retryCount) config._retryCount = 0;
    if (config._retryCount >= 3) return Promise.reject(error);
    config._retryCount += 1;
    await new Promise(r => setTimeout(r, 3000));
    return api(config);
  }
);

export const checkHealth = () => api.get('/');
export const getPrice = (symbol) => api.get(`/price/${symbol}`);
export const getHistory = (symbol, days = 365) => api.get(`/price/${symbol}/history?days=${days}`);
export const updatePrice = (symbol) => api.post(`/price/${symbol}/update`);
export const getAnalysis = (symbol) => api.get(`/analysis/${symbol}`);
export const getStrategies = () => api.get('/backtest/strategies');
export const runBacktest = (payload) => api.post('/backtest/run', payload);
export const compareStrategies = (payload) => api.post('/backtest/compare', payload);

export const saveToSheets = async (result, symbol, strategyName) => {
  const time = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const row = [
    time,
    symbol,
    strategyName,
    result.total_return,
    result.sharpe,
    result.max_drawdown,
    result.win_rate,
    result.total_trades,
    result.initial_cash,
    result.final_value,
  ];
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row }),
    });
    return true;
  } catch {
    return false;
  }
};

