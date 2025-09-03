import React from 'react';
import MarketSelector, { type MarketConfig } from '../components/MarketSelector';

interface SidebarProps {
  currentMarket: MarketConfig | null;
  onMarketChange: (config: MarketConfig) => void;
  loading: boolean;
  connected: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMarket, 
  onMarketChange, 
  loading, 
  connected 
}) => {
  return (
    <aside className="w-80 bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Markets</h2>
        <div className="flex items-center space-x-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {connected ? 'Live Data' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Market Selector */}
      <div className="p-6 flex-1">
        {currentMarket && (
          <MarketSelector 
            currentConfig={currentMarket}
            onConfigChange={onMarketChange}
            loading={loading}
          />
        )}
        
        {/* Market Info */}
        {currentMarket && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Current Market</h3>
            <p className="text-sm text-gray-600">{currentMarket.displayName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {loading ? 'Loading...' : 'Ready'}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;