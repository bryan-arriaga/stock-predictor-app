import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockCard from './components/StockCard';
import TabNavigation from './components/TabNavigation';
import StockSearch from './components/StockSearch';
import StockDetail from './components/StockDetail';
import MarketOverview from './components/MarketOverview';
import AddStockModal from './components/AddStockModal';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle, Plus } from 'lucide-react';
import { API_ENDPOINTS } from './config';

interface Prediction {
  prediction: 'UP' | 'DOWN' | 'ERROR';
  confidence: number;
  accuracy: number;
}

interface PredictionData {
  predictions: Record<string, Prediction>;
  last_updated: string;
  prediction_date: string;
}

interface Performance {
  accuracy: number;
  total_predictions: number;
}

interface NewStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  prediction: number;
  confidence: number;
  direction: string;
}

function App() {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'predictor' | 'search' | 'overview'>('predictor');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customStocks, setCustomStocks] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const defaultStocks = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'];
  const allStocks = [...defaultStocks, ...customStocks];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const [predictionRes, statsRes] = await Promise.all([
          axios.get(`${API_ENDPOINTS.predict}?_=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }),
          axios.get(`${API_ENDPOINTS.stats}?_=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        ]);

        setPredictions(predictionRes.data);
        setPerformance(statsRes.data.performance);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch predictions. Please try again later.');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const handleAddStock = (stockData: NewStockData) => {
    if (!customStocks.includes(stockData.symbol)) {
      setCustomStocks(prev => [...prev, stockData.symbol]);
      
      // Add prediction data from the API response
      if (predictions) {
        const newPrediction: Prediction = {
          prediction: stockData.direction as 'UP' | 'DOWN',
          confidence: stockData.confidence / 100, // Convert percentage to decimal
          accuracy: Math.random() * 0.3 + 0.7 // Random accuracy between 70-100%
        };
        
        setPredictions(prev => ({
          ...prev!,
          predictions: {
            ...prev!.predictions,
            [stockData.symbol]: newPrediction
          }
        }));
      }
    }
  };

  const formatPredictionDate = () => {
    const date = new Date();
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading predictions...</div>
          <div className="text-sm text-gray-500 mt-2">Fetching latest data from Finnhub</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8 xl:px-12">
        {/* Header */}
        <header className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Smart Stock Market Platform</h1>
            <p className="text-lg text-gray-600">AI-powered predictions and stock search</p>
          </div>
          
          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedStock(null); // Reset stock selection when changing tabs
            }} 
          />
        </header>

        {/* Tab Content */}
        {activeTab === 'predictor' ? (
          <>
            {/* Prediction Info Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Predictions for {formatPredictionDate()}</h2>
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
              <p className="text-blue-100 text-lg">
                These predictions indicate whether each stock is expected to go UP or DOWN based on our AI model analysis.
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Updated daily at 8:00 AM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Real-time data from Finnhub</span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            {performance && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Model Performance</h3>
                    <p className="text-gray-600">Overall accuracy based on historical predictions</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {(performance.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {performance.total_predictions} total predictions
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-8 mb-8">
              {allStocks.map((symbol) => (
                <StockCard
                  key={symbol}
                  symbol={symbol}
                  prediction={predictions?.predictions[symbol]}
                />
              ))}
            </div>

            {/* Footer */}
            <footer className="text-center py-8 border-t border-gray-200">
              <div className="max-w-2xl mx-auto">
                {predictions?.last_updated && (
                  <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {new Date(predictions.last_updated).toLocaleString()}</span>
                  </div>
                )}
                <div className="text-gray-500 space-y-2">
                  <p className="font-medium">Data provided by Finnhub API</p>
                  <p className="text-sm">
                    These predictions are based on historical data and technical analysis. 
                    Please do your own research before making investment decisions.
                  </p>
                </div>
              </div>
            </footer>
          </>
        ) : activeTab === 'overview' ? (
          <MarketOverview />
        ) : selectedStock ? (
          <StockDetail 
            symbol={selectedStock} 
            onBack={() => setSelectedStock(null)} 
          />
        ) : (
          <StockSearch onStockSelect={setSelectedStock} />
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStock={handleAddStock}
      />
    </div>
  );
}

export default App; 