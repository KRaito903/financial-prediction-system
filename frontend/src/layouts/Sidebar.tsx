import React from 'react';
import MarketSelector from '../components/MarketSelector';
import ChartSelector from '../components/ChartSelector';
import { useMultiChart } from '../context/MultiChartContext';
import type { MarketConfig } from '../types/chart';

interface SidebarProps {
  // Props are now handled internally via context
}

const Sidebar: React.FC<SidebarProps> = () => {
  const {
    connected,
    viewMode,
    charts,
    selectedChartId,
    setSelectedChartId,
    subscribeToMarket
  } = useMultiChart();

  const selectedChart = charts.find(c => c.id === selectedChartId);
  const isLoading = selectedChart?.loading || false;

  const handleMarketChange = (config: MarketConfig) => {
    subscribeToMarket(config, selectedChartId);
  };

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
      
      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Chart Selector for Multi-Chart View */}
        {viewMode === 'multi' && (
          <div className="mb-6">
            <ChartSelector
              charts={charts}
              selectedChartId={selectedChartId}
              onChartSelect={setSelectedChartId}
              loading={isLoading}
            />
          </div>
        )}
        
        {/* Market Selector */}
        {selectedChart && (
          <div className={viewMode === 'multi' ? 'mt-6' : ''}>
            <MarketSelector 
              currentConfig={selectedChart.market || {
                symbol: 'BTC/USDT',
                interval: '1m',
                displayName: 'BTC/USDT - 1m'
              }}
              onConfigChange={handleMarketChange}
              loading={isLoading}
            />
          </div>
        )}
        
        {/* Current Market Info */}
        {selectedChart?.market && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              {viewMode === 'multi' 
                ? `Chart ${charts.findIndex(c => c.id === selectedChartId) + 1} Market`
                : 'Current Market'
              }
            </h3>
            <p className="text-sm text-gray-600">{selectedChart.market.displayName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {isLoading ? 'Loading...' : 'Ready'}
            </p>
            {selectedChart.error && (
              <p className="text-xs text-red-600 mt-1">Error occurred</p>
            )}
          </div>
        )}

        {/* View Mode Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            {viewMode === 'single' ? 'Single Chart Mode' : 'Multi-Chart Mode'}
          </h3>
          <p className="text-xs text-blue-700">
            {viewMode === 'single' 
              ? 'View one chart with time range selection available'
              : 'View 4 charts simultaneously. Select a chart above to configure its market.'
            }
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;