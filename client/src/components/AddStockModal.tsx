import React, { useState } from 'react';
import { X, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (stock: NewStockData) => void;
}

interface NewStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  prediction: number;
  confidence: number;
  direction: string;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onAddStock }) => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.addStock, {
        symbol: stockSymbol.toUpperCase()
      });

      const stockData: NewStockData = {
        symbol: response.data.symbol,
        name: response.data.name,
        currentPrice: response.data.currentPrice,
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        direction: response.data.direction
      };

      onAddStock(stockData);
      setStockSymbol('');
      onClose();
    } catch (err: any) {
      console.error('Add stock error:', err);
      if (err.response?.status === 404) {
        setError('Stock symbol not found. Please check the symbol and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to add stock. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Stock
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="stockSymbol" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Symbol
            </label>
            <input
              id="stockSymbol"
              type="text"
              placeholder="e.g., TSLA, META, NFLX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid stock ticker symbol
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={isLoading || !stockSymbol.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Add Stock
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>How it works:</strong> We'll fetch the current stock price from Finnhub and generate an AI prediction based on historical data analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal; 