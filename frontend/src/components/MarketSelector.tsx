import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { fetchTradingPairs, type TradingPair } from '../lib/api';
import type { MarketConfig } from '../types/chart';

interface MarketSelectorProps {
  currentConfig: MarketConfig;
  onConfigChange: (config: MarketConfig) => void;
  loading?: boolean;
}


const TIME_INTERVALS = [
  { value: '1s', label: '1s' },
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
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [pairsError, setPairsError] = useState<string | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    const loadTradingPairs = async () => {
      try {
        setPairsLoading(true);
        setPairsError(null);
        const pairs = await fetchTradingPairs();
        setTradingPairs(pairs);
      } catch (error) {
        console.error('Failed to load trading pairs:', error);
        setPairsError('Failed to load trading pairs');
        // Fallback pairs are handled in fetchTradingPairs
        setTradingPairs([
          { value: 'BTC/USDT', label: 'BTC/USDT' },
          { value: 'ETH/USDT', label: 'ETH/USDT' },
          { value: 'BNB/USDT', label: 'BNB/USDT' },
        ]);
      } finally {
        setPairsLoading(false);
      }
    };

    loadTradingPairs();
  }, []);

  const handleApply = () => {
    const symbolLabel = tradingPairs.find(p => p.value === selectedSymbol)?.label || selectedSymbol;
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
        {pairsError && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            {pairsError} - Using fallback pairs
          </div>
        )}
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between"
              disabled={loading || pairsLoading}
            >
              {selectedSymbol
                ? tradingPairs.find((pair) => pair.value === selectedSymbol)?.label
                : "Select trading pair..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search trading pairs..." className="h-9" />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>
                  {pairsLoading ? 'Loading trading pairs...' : 'No trading pair found.'}
                </CommandEmpty>
                <CommandGroup>
                  {tradingPairs.map((pair) => (
                    <CommandItem
                      key={pair.value}
                      value={pair.value}
                      onSelect={(currentValue) => {
                        setSelectedSymbol(currentValue === selectedSymbol ? "" : currentValue);
                        setComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSymbol === pair.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {pair.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
        disabled={!hasChanges || loading || pairsLoading}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          hasChanges && !loading && !pairsLoading
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Applying...' : pairsLoading ? 'Loading pairs...' : 'Apply Changes'}
      </button>
    </div>
  );
};

export default MarketSelector;