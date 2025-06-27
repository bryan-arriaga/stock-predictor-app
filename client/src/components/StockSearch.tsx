import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
}

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(API_ENDPOINTS.search(encodeURIComponent(searchQuery)));
      setSearchResults(response.data.results || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Failed to search stocks. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Search Stocks</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter stock symbol or company name (e.g., AAPL, Apple)..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Search Results ({searchResults.length} found)</h3>
          <p className="text-sm text-gray-600">Click on any stock to view detailed information</p>
          {searchResults.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => onStockSelect(stock.symbol)}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
                    <span className="text-gray-600">{stock.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Market Cap:</span>
                      <span className="font-medium">{stock.marketCap}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">{stock.volume}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-1 ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchQuery && searchResults.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-600">
          No stocks found for "{searchQuery}". Try a different search term.
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Search for Stocks</h3>
          <p>Enter a stock symbol (like AAPL) or company name (like Apple) to get started.</p>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 