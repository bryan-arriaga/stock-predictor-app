import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';

interface Prediction {
  prediction: 'UP' | 'DOWN' | 'ERROR';
  confidence: number;
  accuracy: number;
}

interface StockCardProps {
  symbol: string;
  prediction?: Prediction;
}

interface StockData {
  timestamp: number;
  price: number;
}

interface DailySummary {
  open: number | null;
  close: number | null;
  high: number | null;
  low: number | null;
  percent_change: number | null;
}

const StockCard: React.FC<StockCardProps> = ({ symbol, prediction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.stockData(symbol));
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stock data');
      }
      const result = await response.json();
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('No stock data available');
      }
      setStockData(result.data);
      setError(null);
      setIsLive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
    }
    setLoading(false);
  };

  const fetchDailySummary = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.summary(symbol));
      if (response.ok) {
        const summary = await response.json();
        setDailySummary(summary);
      }
    } catch (err) {
      console.error('Error fetching daily summary:', err);
    }
  };

  // Fetch daily summary on component mount
  useEffect(() => {
    fetchDailySummary();
    const interval = setInterval(fetchDailySummary, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    if (isExpanded) {
      fetchStockData();
      const interval = setInterval(() => {
        fetchStockData();
        fetchDailySummary();
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isExpanded, symbol]);

  const getCardColor = () => {
    // Base card color on actual stock performance, not prediction
    if (!dailySummary || dailySummary.percent_change === null || dailySummary.percent_change === undefined) {
      return 'bg-gray-50 border-gray-200'; // Neutral when no data
    }
    
    if (dailySummary.percent_change >= 0) {
      return 'bg-green-50 border-green-200'; // Green if stock is up
    } else {
      return 'bg-red-50 border-red-200'; // Red if stock is down
    }
  };

  const getPredictionIcon = () => {
    if (!prediction) return '❓';
    switch (prediction.prediction) {
      case 'UP':
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
      case 'DOWN':
        return <TrendingDown className="w-6 h-6 text-purple-600" />;
      default:
        return '❓';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    return `$${price.toFixed(2)}`;
  };

  const getChartDomain = () => {
    if (stockData.length === 0) return [0, 0];
    const prices = stockData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  };

  const getPercentChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPercentChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div 
      className={`${getCardColor()} rounded-lg p-6 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isExpanded ? 'scale-[1.02] stock-card-expanded' : 'scale-100'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{symbol}</h2>
          {dailySummary ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(dailySummary.close)}</span>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                  (dailySummary.percent_change ?? 0) >= 0 
                    ? 'bg-green-200 text-green-800 border border-green-300' 
                    : 'bg-red-200 text-red-800 border border-red-300'
                }`}>
                  {getPercentChangeIcon(dailySummary.percent_change ?? 0)}
                  <span>
                    {(dailySummary.percent_change ?? 0) >= 0 ? '+' : ''}{(dailySummary.percent_change ?? 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Loading price data...</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getPredictionIcon()}
        </div>
      </div>

      {/* Prediction Info */}
      {prediction ? (
        <div className="space-y-3 mb-4 pt-3 border-t border-gray-200">
          <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${
            prediction.prediction === 'UP' 
              ? 'text-blue-600' 
              : 'text-purple-600'
          }`}>AI Prediction</div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Tomorrow:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm px-2 py-1 rounded ${
                prediction.prediction === 'UP' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {prediction.prediction}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Confidence:</span>
            <span className="text-gray-700 font-medium">
              {prediction.confidence ? (prediction.confidence * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Model Accuracy:</span>
            <span className="text-gray-900">
              {prediction.accuracy ? (prediction.accuracy * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 mb-4 pt-2 border-t border-gray-200">Loading prediction...</div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-8">
          <Tabs.Root defaultValue="chart" className="w-full">
            <Tabs.List 
              className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6"
              onClick={(e) => e.stopPropagation()}
            >
              <Tabs.Trigger
                value="chart"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <BarChart3 className="w-4 h-4" />
                Chart
              </Tabs.Trigger>
              <Tabs.Trigger
                value="stats"
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <DollarSign className="w-4 h-4" />
                Daily Stats
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="chart" className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200 h-96">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading chart...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-600">
                      <p className="text-lg">📉</p>
                      <p className="mt-2">{error}</p>
                    </div>
                  </div>
                ) : stockData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <p className="text-lg">⛔</p>
                      <p className="mt-2">No data available</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        tick={{ fontSize: 12, fill: '#4B5563' }}
                        stroke="#9CA3AF"
                      />
                      <YAxis 
                        domain={getChartDomain()}
                        tickFormatter={formatPrice}
                        tick={{ fontSize: 12, fill: '#4B5563' }}
                        stroke="#9CA3AF"
                      />
                      <Tooltip 
                        labelFormatter={formatTime}
                        formatter={(value: number) => [formatPrice(value), 'Price']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          padding: '0.75rem'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="stats" className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                {dailySummary ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Summary</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Open:</span>
                          <span className="font-semibold text-lg">{formatPrice(dailySummary.open)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">High:</span>
                          <span className="font-semibold text-lg text-green-600">{formatPrice(dailySummary.high)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Close:</span>
                          <span className="font-semibold text-lg">{formatPrice(dailySummary.close)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Low:</span>
                          <span className="font-semibold text-lg text-red-600">{formatPrice(dailySummary.low)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium text-lg">Daily Change:</span>
                        <div className={`flex items-center gap-2 font-semibold text-lg ${getPercentChangeColor(dailySummary.percent_change ?? 0)}`}>
                          {getPercentChangeIcon(dailySummary.percent_change ?? 0)}
                          <span>
                            {(dailySummary.percent_change ?? 0) >= 0 ? '+' : ''}{(dailySummary.percent_change ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <p className="text-lg">⏳</p>
                    <p className="mt-2">Loading daily summary...</p>
                  </div>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </div>
  );
};

export default StockCard; 