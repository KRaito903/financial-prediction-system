import React from 'react';
import { ChartComponent } from '../components/Dashboard';
import TimeRangeSelector from '../components/TimeRangeSelector';
import ChartViewToggle from '../components/ChartViewToggle';
import MultiChartView from '../components/MultiChartView';
import { useMultiChart } from '../context/MultiChartContext';
import type { TimeRange } from '../types/chart';

interface MainContentProps {
  // These are now handled internally via context
}

const MainContent: React.FC<MainContentProps> = () => {
  const {
    viewMode,
    charts,
    selectedChartId,
    setViewMode,
    setSelectedChartId,
    fetchHistoricalData
  } = useMultiChart();

  const selectedChart = charts.find(c => c.id === selectedChartId);
  const hasError = viewMode === 'single' 
    ? selectedChart?.error 
    : charts.some(c => c.error);

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <nav className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Trading Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <ChartViewToggle 
                currentView={viewMode}
                onViewChange={setViewMode}
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Chart Area */}
      <div className="p-6" style={{ height: 'calc(100vh - 88px)' }}>
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">
              {viewMode === 'single' 
                ? selectedChart?.error 
                : 'One or more charts have errors'
              }
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow h-full p-6">
          {viewMode === 'single' ? (
            <>
              {/* Single Chart View */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedChart?.market?.displayName || 'Select a Market'}
                </h2>
                <div className="flex items-center gap-3">
                  <TimeRangeSelector 
                    onTimeRangeSelect={(timeRange: TimeRange) => fetchHistoricalData(timeRange)}
                    loading={selectedChart?.loading || false}
                  />
                  {selectedChart?.loading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-600">Loading data...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-96">
                {selectedChart?.candlestickData.length ? (
                  <ChartComponent 
                    data={selectedChart.candlestickData}
                    height={384}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                    <div className="text-center">
                      {selectedChart?.loading ? (
                        <>
                          <div className="animate-pulse">
                            <div className="h-32 w-full bg-gray-200 rounded mb-4"></div>
                          </div>
                          <p className="text-gray-500">Loading chart data...</p>
                        </>
                      ) : (
                        <p className="text-gray-500">
                          {selectedChart?.market ? 'No data available' : 'Select a market to view data'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Multi Chart View */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Multi-Chart View
                </h2>
                <div className="text-sm text-gray-600">
                  Click on a chart to select it for configuration
                </div>
              </div>
              
              <div style={{ height: 'calc(100% - 64px)' }}>
                <MultiChartView
                  charts={charts}
                  selectedChartId={selectedChartId}
                  onChartSelect={setSelectedChartId}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainContent;