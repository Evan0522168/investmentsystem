import axios from 'axios';

const BASE = 'https://investment-system-1w3q.onrender.com';

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
export const getHistory = (symbol, days = 90) => api.get(`/price/${symbol}/history?days=${days}`);
export const updatePrice = (symbol) => api.post(`/price/${symbol}/update`);
export const getAnalysis = (symbol) => api.get(`/analysis/${symbol}`);
export const getStrategies = () => api.get('/backtest/strategies');
export const runBacktest = (payload) => api.post('/backtest/run', payload);
export const compareStrategies = (payload) => api.post('/backtest/compare', payload);
