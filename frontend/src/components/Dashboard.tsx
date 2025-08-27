import React, {useRef} from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { CandlestickSeries, createChart, ColorType } from 'lightweight-charts';

export const ChartComponent = (props) => {
  const { data,
        colors: {
            backgroundColor = 'white',
            textColor = 'black',
            upColor = '#26a69a',
            downColor = '#ef5350',
            borderVisible = false,
            wickUpColor = '#26a69a',
            wickDownColor = '#ef5350',
        } = {},
      } = props
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
          background: { type: ColorType.Solid, color: backgroundColor },
          textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    }
    chart.timeScale().fitContent();
    const newSeries = chart.addSeries(CandlestickSeries, { 
      upColor, 
      downColor, 
      borderVisible,
      wickUpColor,
      wickDownColor,
    });
    newSeries.setData(data);

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);

        chart.remove();
    };
  }, [data, backgroundColor, textColor, upColor, downColor, borderVisible, wickUpColor, wickDownColor])
  
  return (
    <div className="relative">
      <div ref={chartContainerRef} />
    </div>
  );
}

const Dashboard: React.FC = () => {
  // const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { connected, candlestickData, error } = useSocket();

  const handleLogout = () => {
    // logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Financial Prediction System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-700">
                  {connected ? 'Live Data' : 'Disconnected'}
                </span>
              </div>
              <span className="text-sm text-gray-700">
                {/* Welcome, {user?.name} */}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Real-time BTC/USDT candlestick chart powered by Binance data
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-red-800 font-medium">Connection Error</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}
              
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Market Data Status
                </h3>
                <div className="text-left space-y-2">
                  <p><span className="font-medium">Connection:</span> {connected ? '✅ Connected' : '❌ Disconnected'}</p>
                  <p><span className="font-medium">Data Points:</span> {candlestickData.length}</p>
                  <p><span className="font-medium">Symbol:</span> BTC/USDT</p>
                  <p><span className="font-medium">Interval:</span> 1 minute</p>
                </div>
              </div>
              
              <div className="mt-6">
                {candlestickData.length > 0 ? (
                  <ChartComponent data={candlestickData} />
                ) : (
                  <div className="bg-white p-8 rounded-lg shadow text-center">
                    <div className="animate-pulse">
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                    <p className="text-gray-500 mt-4">
                      {connected ? 'Waiting for market data...' : 'Connecting to data stream...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;