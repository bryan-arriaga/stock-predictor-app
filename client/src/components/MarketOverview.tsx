import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, BarChart3, Globe, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

interface MarketIndex {
  symbol: string;
  name: string;
  current: number;
  change: number;
  changePercent: number;
}

interface TopMover {
  symbol: string;
  name: string;
  current: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface MarketData {
  indices: MarketIndex[];
  topGainers: TopMover[];
  topLosers: TopMover[];
  marketSentiment: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  marketStats: {
    totalVolume: number;
    activeSymbols: number;
    marketCap: number;
    volatilityIndex: number;
  };
  lastUpdated: string;
}

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.base}/api/market-overview`);
      setMarketData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">⚠️ {error}</div>
        <button
          onClick={fetchMarketData}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No market data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Market Overview
          </h2>
          <p className="text-gray-600 mt-1">Real-time market data and analytics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Last updated: {new Date(marketData.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Market Indices */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Major Indices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketData.indices.map((index) => (
            <div key={index.symbol} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{index.name}</h4>
                <span className="text-sm text-gray-500">{index.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(index.current)}
                </span>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  index.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {index.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercentage(index.changePercent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Gainers
          </h3>
          <div className="space-y-3">
            {marketData.topGainers.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600 truncate max-w-32">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatPrice(stock.current)}</div>
                  <div className="text-sm font-medium text-green-600">
                    {formatPercentage(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Top Losers
          </h3>
          <div className="space-y-3">
            {marketData.topLosers.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600 truncate max-w-32">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatPrice(stock.current)}</div>
                  <div className="text-sm font-medium text-red-600">
                    {formatPercentage(stock.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Sentiment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Market Sentiment
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-medium">Bullish</span>
              <span className="text-lg font-bold text-green-600">
                {marketData.marketSentiment.bullish}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${marketData.marketSentiment.bullish}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Neutral</span>
              <span className="text-lg font-bold text-gray-600">
                {marketData.marketSentiment.neutral}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-600 h-2 rounded-full"
                style={{ width: `${marketData.marketSentiment.neutral}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-red-600 font-medium">Bearish</span>
              <span className="text-lg font-bold text-red-600">
                {marketData.marketSentiment.bearish}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${marketData.marketSentiment.bearish}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Market Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Market Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatLargeNumber(marketData.marketStats.totalVolume)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Volume</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatLargeNumber(marketData.marketStats.activeSymbols)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Symbols</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatLargeNumber(marketData.marketStats.marketCap)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Market Cap</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {marketData.marketStats.volatilityIndex.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Volatility Index</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview; 