// API Configuration
const isProduction = window.location.hostname !== 'localhost';

export const API_BASE_URL = isProduction 
  ? 'https://your-actual-backend-url.vercel.app'  // Replace with your real backend URL
  : 'http://localhost:5000';

export const API_ENDPOINTS = {
  predict: `${API_BASE_URL}/api/predict`,
  stats: `${API_BASE_URL}/api/stats`,
  stockData: (symbol: string) => `${API_BASE_URL}/api/stock-data/${symbol}`,
  summary: (symbol: string) => `${API_BASE_URL}/api/summary/${symbol}`,
  search: (query: string) => `${API_BASE_URL}/api/search/${query}`,
  addStock: `${API_BASE_URL}/api/add-stock`
}; 