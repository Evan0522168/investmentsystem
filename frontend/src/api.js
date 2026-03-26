import axios from 'axios';

const BASE = 'https://investment-system-1w3q.onrender.com';

export const getPrice = (stockId) =>
  axios.get(`${BASE}/price/${stockId}`);

export const getHistory = (stockId, days = 90) =>
  axios.get(`${BASE}/price/${stockId}/history?days=${days}`);

export const getAnalysis = (stockId) =>
  axios.get(`${BASE}/analysis/${stockId}`);

export const getPortfolio = () =>
  axios.get(`${BASE}/portfolio/`);

export const executeTrade = (stockId, shares, price, action) =>
  axios.post(`${BASE}/trade/execute`, { stock_id: stockId, shares, price, action });

export const getTradeHistory = () =>
  axios.get(`${BASE}/trade/history`);
