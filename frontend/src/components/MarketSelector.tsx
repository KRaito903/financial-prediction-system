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
  { value: 'BTC/USDT', label: 'BTC/USDT' },
  { value: 'ETH/USDT', label: 'ETH/USDT' },
  { value: 'BNB/USDT', label: 'BNB/USDT' },
];

const TIME_INTERVALS = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Trading Pair
        </label>
        <div className="space-y-2">
          {COIN_PAIRS.map(pair => (
            <button
              key={pair.value}
              onClick={() => setSelectedSymbol(pair.value)}
              disabled={loading}
              className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                selectedSymbol === pair.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Time Frame
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_INTERVALS.map(interval => (
            <button
              key={interval.value}
              onClick={() => setSelectedInterval(interval.value)}
              disabled={loading}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedInterval === interval.value
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleApply}
        disabled={!hasChanges || loading}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          hasChanges && !loading
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Applying...' : 'Apply Changes'}
      </button>
    </div>
  );
};

export default MarketSelector;