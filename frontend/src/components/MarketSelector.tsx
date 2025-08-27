import React, { useState } from 'react';

export interface MarketConfig {
  symbol: string;
  interval: string;
  displayName: string;
}

interface MarketSelectorProps {
  currentConfig: MarketConfig;
  onConfigChange: (config: MarketConfig) => void;
  loading?: boolean;
}

const COIN_PAIRS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'BTCUSDC', label: 'BTC/USDC' },
];

const TIME_INTERVALS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
];

const MarketSelector: React.FC<MarketSelectorProps> = ({ 
  currentConfig, 
  onConfigChange, 
  loading = false 
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(currentConfig.symbol);
  const [selectedInterval, setSelectedInterval] = useState(currentConfig.interval);

  const handleApply = () => {
    const symbolLabel = COIN_PAIRS.find(p => p.value === selectedSymbol)?.label || selectedSymbol;
    const intervalLabel = TIME_INTERVALS.find(i => i.value === selectedInterval)?.label || selectedInterval;
    
    onConfigChange({
      symbol: selectedSymbol,
      interval: selectedInterval,
      displayName: `${symbolLabel} - ${intervalLabel}`
    });
  };

  const hasChanges = selectedSymbol !== currentConfig.symbol || selectedInterval !== currentConfig.interval;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coin Pair
          </label>
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          >
            {COIN_PAIRS.map(pair => (
              <option key={pair.value} value={pair.value}>
                {pair.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Interval
          </label>
          <select 
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          >
            {TIME_INTERVALS.map(interval => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Current: {currentConfig.displayName}
        </div>
        <button
          onClick={handleApply}
          disabled={!hasChanges || loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            hasChanges && !loading
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Applying...' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
};

export default MarketSelector;