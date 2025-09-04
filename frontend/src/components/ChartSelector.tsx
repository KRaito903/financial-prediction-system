import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/button';
import type { ChartConfig } from '../types/chart';

interface ChartSelectorProps {
  charts: ChartConfig[];
  selectedChartId: string;
  onChartSelect: (chartId: string) => void;
  loading?: boolean;
}

const ChartSelector: React.FC<ChartSelectorProps> = ({ 
  charts, 
  selectedChartId, 
  onChartSelect, 
  loading = false 
}) => {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">
        Select Chart to Configure
      </div>
      <div className="grid grid-cols-2 gap-2">
        {charts.map((chart, index) => (
          <Button
            key={chart.id}
            variant="outline"
            size="sm"
            onClick={() => onChartSelect(chart.id)}
            disabled={loading}
            className={`flex items-center justify-between px-3 py-2 h-auto ${
              selectedChartId === chart.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-start space-y-1">
              <span className="text-xs font-medium">
                Chart {index + 1}
              </span>
              {chart.market ? (
                <span className="text-xs text-gray-600 truncate max-w-[80px]">
                  {chart.market.symbol}
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  No market
                </span>
              )}
            </div>
            {selectedChartId === chart.id && (
              <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            )}
          </Button>
        ))}
      </div>
      
      {/* Selected Chart Info */}
      {(() => {
        const selectedChart = charts.find(c => c.id === selectedChartId);
        return selectedChart && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Selected: Chart {charts.findIndex(c => c.id === selectedChartId) + 1}
            </div>
            <div className="text-xs text-gray-600">
              {selectedChart.market 
                ? selectedChart.market.displayName 
                : 'No market selected'
              }
            </div>
            {selectedChart.loading && (
              <div className="text-xs text-blue-600 mt-1">Loading...</div>
            )}
            {selectedChart.error && (
              <div className="text-xs text-red-600 mt-1">Error</div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ChartSelector;