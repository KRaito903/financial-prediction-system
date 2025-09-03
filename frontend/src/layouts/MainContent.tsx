import React from 'react';
import { ChartComponent } from '../components/Dashboard';
import type { MarketConfig } from '../components/MarketSelector';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  symbol?: string;
  interval?: string;
}

interface MainContentProps {
  candlestickData: CandlestickData[];
  currentMarket: MarketConfig | null;
  error: string | null;
  loading: boolean;
}

const MainContent: React.FC<MainContentProps> = ({
  candlestickData,
  currentMarket,
  error,
  loading
}) => {
  return (
    <main className="flex-1 bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <nav className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Trading Dashboard
            </h1>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Chart Area */}
      <div className="p-6 h-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow h-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentMarket?.displayName || 'Select a Market'}
            </h2>
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span className="text-sm text-gray-600">Loading data...</span>
              </div>
            )}
          </div>
          
          <div className="h-96">
            {candlestickData.length > 0 ? (
              <ChartComponent data={candlestickData} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="h-32 w-full bg-gray-200 rounded mb-4"></div>
                  </div>
                  <p className="text-gray-500">
                    {loading ? 'Loading chart data...' : 'Select a market to view data'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MainContent;