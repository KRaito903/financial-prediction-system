import React from 'react';
import { ChartComponent } from './Dashboard';
import type { ChartConfig } from '../types/chart';

interface MultiChartViewProps {
  charts: ChartConfig[];
  selectedChartId: string;
  onChartSelect: (chartId: string) => void;
}

const MultiChartView: React.FC<MultiChartViewProps> = ({ 
  charts, 
  selectedChartId, 
  onChartSelect 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {charts.map((chart, index) => (
        <div
          key={chart.id}
          className={`bg-white rounded-lg shadow border-2 transition-colors cursor-pointer ${
            selectedChartId === chart.id 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChartSelect(chart.id)}
        >
          {/* Chart Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedChartId === chart.id ? 'bg-indigo-500' : 'bg-gray-300'
                }`}></div>
                <h3 className="text-sm font-medium text-gray-900">
                  Chart {index + 1}
                </h3>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                {chart.loading && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                )}
                {chart.error && (
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>
            
            {/* Market Info */}
            <div className="mt-1">
              <p className="text-xs text-gray-600 truncate">
                {chart.market ? chart.market.displayName : 'No market selected'}
              </p>
            </div>
          </div>

          {/* Chart Content */}
          <div className="p-3" style={{ height: 'calc(100% - 80px)' }}>
            {chart.candlestickData.length > 0 ? (
              <div className="h-full">
                <ChartComponent 
                  data={chart.candlestickData}
                  colors={{
                    backgroundColor: selectedChartId === chart.id ? '#fefbff' : 'white',
                    textColor: 'black',
                    upColor: '#26a69a',
                    downColor: '#ef5350',
                    borderVisible: false,
                    wickUpColor: '#26a69a',
                    wickDownColor: '#ef5350',
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  {chart.loading ? (
                    <div className="space-y-2">
                      <div className="animate-pulse">
                        <div className="h-16 w-full bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <p className="text-xs text-gray-500">Loading data...</p>
                    </div>
                  ) : chart.error ? (
                    <div className="space-y-2">
                      <div className="text-red-500">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs text-red-600">Error loading data</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-500">
                        {chart.market ? 'No data available' : 'Select a market'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultiChartView;