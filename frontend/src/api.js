import axios from 'axios';

const BASE = 'https://investment-system-1w3q.onrender.com';

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
});

let retryCount = 0;

api.interceptors.response.use(
  (response) => {
    retryCount = 0;
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config._retryCount) config._retryCount = 0;
    if (config._retryCount >= 3) return Promise.reject(error);
    config._retryCount += 1;
    await new Promise(r => setTimeout(r, 3000));
    return api(config);
  }
);

export const checkHealth = () =>
  api.get('/');

export const getPrice = (stockId) =>
  api.get(`/price/${stockId}`);

export const getHistory = (stockId, days = 90) =>
  api.get(`/price/${stockId}/history?days=${days}`);

export const getAnalysis = (stockId) =>
  api.get(`/analysis/${stockId}`);

export const getPortfolio = () =>
  api.get(`/portfolio/`);

export const executeTrade = (stockId, shares, price, action) =>
  api.post(`/trade/execute`, { stock_id: stockId, shares, price, action });

export const getTradeHistory = () =>
  api.get(`/trade/history`);
