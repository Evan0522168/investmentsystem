import axios from 'axios';

const BASE = 'https://048b8307-e070-4516-80c2-1c01e1463ad6-00-pt07chbqm24b.sisko.replit.dev';

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
