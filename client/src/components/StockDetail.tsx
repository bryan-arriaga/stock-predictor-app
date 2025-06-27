import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Globe, Users, Building2 } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartData {
  timestamp: number;
  price: number;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol, onBack }) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ChartData; x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch both stock summary and chart data
        const [summaryRes, chartRes] = await Promise.all([
          axios.get(API_ENDPOINTS.summary(symbol)),
          axios.get(API_ENDPOINTS.stockData(symbol))
        ]);

        // Create stock data object
        const summary = summaryRes.data;
        const stockInfo: StockData = {
          symbol: symbol.toUpperCase(),
          name: `${symbol.toUpperCase()} Inc.`, // Placeholder name
          price: summary.close || 0,
          change: summary.close - summary.open || 0,
          changePercent: summary.percent_change || 0,
          marketCap: 'N/A',
          volume: 'N/A',
          open: summary.open || 0,
          high: summary.high || 0,
          low: summary.low || 0,
          close: summary.close || 0
        };

        setStockData(stockInfo);
        
        // Set chart data
        if (chartRes.data.data) {
          setChartData(chartRes.data.data);
        }

      } catch (err: any) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  const formatPrice = (price: number) => {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  };

  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({percent.toFixed(2)}%)
        </span>
      </div>
    );
  };

    const renderInteractiveChart = () => {
    if (chartData.length === 0) return null;

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const chartHeight = 300;
    const chartWidth = Math.max(800, chartData.length * 8);
    const isPositive = chartData[chartData.length - 1]?.price >= chartData[0]?.price;

    // Create path data
    const pathData = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * (chartWidth - 40);
      const y = chartHeight - 40 - ((point.price - minPrice) / priceRange) * (chartHeight - 80);
      return `${index === 0 ? 'M' : 'L'} ${x + 20} ${y}`;
    }).join(' ');

    // Create area fill path
    const areaPath = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * (chartWidth - 40);
      const y = chartHeight - 40 - ((point.price - minPrice) / priceRange) * (chartHeight - 80);
      if (index === 0) return `M ${x + 20} ${chartHeight - 40} L ${x + 20} ${y}`;
      if (index === chartData.length - 1) return `L ${x + 20} ${y} L ${x + 20} ${chartHeight - 40} Z`;
      return `L ${x + 20} ${y}`;
    }).join(' ');

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      
      // Find closest data point
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      chartData.forEach((point, index) => {
        const x = (index / (chartData.length - 1)) * (chartWidth - 40) + 20;
        const distance = Math.abs(mouseX - x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestDistance < 50) { // Only show tooltip if within 50px
        const point = chartData[closestIndex];
        const x = (closestIndex / (chartData.length - 1)) * (chartWidth - 40) + 20;
        const y = chartHeight - 40 - ((point.price - minPrice) / priceRange) * (chartHeight - 80);
        
        setHoveredPoint({ point, x, y });
      } else {
        setHoveredPoint(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };

    return (
      <div className="bg-white rounded-lg p-6 mt-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Price Chart (Recent)</h4>
          <div className="text-sm text-gray-600">
            Hover over the chart to see price details
          </div>
        </div>
        
        <div className="relative overflow-x-auto overflow-y-hidden border border-gray-200 rounded-lg bg-gray-50">
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="block cursor-crosshair"
            style={{ minWidth: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight - 40 - ratio * (chartHeight - 80);
              const price = minPrice + ratio * priceRange;
              return (
                <g key={ratio}>
                  <line
                    x1={20}
                    y1={y}
                    x2={chartWidth - 20}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={10}
                    y={y + 4}
                    fill="#6b7280"
                    fontSize="10"
                    textAnchor="end"
                  >
                    ${price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path
              d={areaPath}
              fill={isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            />

            {/* Price line */}
            <path
              d={pathData}
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="3"
              fill="none"
            />

            {/* Hoverable line overlay for better interaction */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth="20"
              fill="none"
              className="cursor-crosshair"
            />

            {/* Crosshair and hover point */}
            {hoveredPoint && (
              <g>
                {/* Vertical crosshair line */}
                <line
                  x1={hoveredPoint.x}
                  y1={20}
                  x2={hoveredPoint.x}
                  y2={chartHeight - 40}
                  stroke="#6b7280"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                
                {/* Horizontal crosshair line */}
                <line
                  x1={20}
                  y1={hoveredPoint.y}
                  x2={chartWidth - 20}
                  y2={hoveredPoint.y}
                  stroke="#6b7280"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                
                {/* Hover point */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="6"
                  fill="white"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth="3"
                />
              </g>
            )}

            {/* Time axis labels */}
            {chartData.filter((_, index) => index % Math.ceil(chartData.length / 8) === 0).map((point, index, filteredData) => {
              const originalIndex = chartData.findIndex(p => p.timestamp === point.timestamp);
              const x = (originalIndex / (chartData.length - 1)) * (chartWidth - 40) + 20;
              return (
                <text
                  key={point.timestamp}
                  x={x}
                  y={chartHeight - 10}
                  fill="#6b7280"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </text>
              );
            })}
          </svg>

          {/* Custom Tooltip */}
          {hoveredPoint && (
            <div 
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(hoveredPoint.x + 10, chartWidth - 200),
                top: Math.max(hoveredPoint.y - 60, 10),
                fontSize: '12px'
              }}
            >
              <div className="font-semibold text-green-400">
                ${hoveredPoint.point.price.toFixed(2)}
              </div>
              <div className="text-gray-300">
                {new Date(hoveredPoint.point.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {chartData.length > 1 && (
                <div className="text-gray-400 text-xs mt-1">
                  {hoveredPoint.point.price >= chartData[0].price ? '↗' : '↘'} 
                  {' '}
                  {((hoveredPoint.point.price - chartData[0].price) / chartData[0].price * 100).toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">Price Trend</span>
            </div>
            <div className="text-gray-500">
              Range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
            </div>
          </div>
          <div className="text-gray-500">
            {chartData.length} data points
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Loading...</h2>
        </div>
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Error</h2>
        </div>
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stockData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{stockData.symbol}</h2>
          <p className="text-gray-600">{stockData.name}</p>
        </div>
      </div>

      {/* Main Stock Info Card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatPrice(stockData.price)}
            </div>
            {formatChange(stockData.change, stockData.changePercent)}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">As of market close</div>
            <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Open</div>
            <div className="font-semibold">{formatPrice(stockData.open)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">High</div>
            <div className="font-semibold text-green-600">{formatPrice(stockData.high)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Low</div>
            <div className="font-semibold text-red-600">{formatPrice(stockData.low)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Close</div>
            <div className="font-semibold">{formatPrice(stockData.close)}</div>
          </div>
        </div>

        {/* Interactive Chart */}
        {renderInteractiveChart()}
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol</span>
              <span className="font-medium">{stockData.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap</span>
              <span className="font-medium">{stockData.marketCap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume</span>
              <span className="font-medium">{stockData.volume}</span>
            </div>
          </div>
        </div>

        {/* Trading Info Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Trading Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Day Range</span>
              <span className="font-medium">
                {formatPrice(stockData.low)} - {formatPrice(stockData.high)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Day Change</span>
              <span className={`font-medium ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">% Change</span>
              <span className={`font-medium ${stockData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Disclaimer</p>
        <p>
          Stock data is provided for informational purposes only and should not be considered as investment advice. 
          Please consult with a financial advisor before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default StockDetail; 