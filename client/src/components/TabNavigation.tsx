import React from 'react';
import { TrendingUp, Search, BarChart3 } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'predictor' | 'search' | 'overview';
  onTabChange: (tab: 'predictor' | 'search' | 'overview') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm border border-gray-200 mb-6">
      <button
        onClick={() => onTabChange('predictor')}
        className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all duration-200 flex-1 justify-center ${
          activeTab === 'predictor'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <TrendingUp className="h-5 w-5" />
        Stock Predictor
      </button>
      
      <button
        onClick={() => onTabChange('search')}
        className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all duration-200 flex-1 justify-center ${
          activeTab === 'search'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Search className="h-5 w-5" />
        Search Stocks
      </button>

      <button
        onClick={() => onTabChange('overview')}
        className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all duration-200 flex-1 justify-center ${
          activeTab === 'overview'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <BarChart3 className="h-5 w-5" />
        Market Overview
      </button>
    </div>
  );
};

export default TabNavigation; 