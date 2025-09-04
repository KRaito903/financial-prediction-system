import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApolloClient } from '@apollo/client';
import type { ReactNode } from 'react';
import { GET_LATEST_KLINES, GET_HISTORICAL_KLINES } from '../lib/queries';
import type { 
  CandlestickData, 
  MarketConfig, 
  ChartConfig, 
  ViewMode, 
  TimeRange 
} from '../types/chart';

interface MultiChartContextType {
  socket: Socket | null;
  connected: boolean;
  viewMode: ViewMode;
  charts: ChartConfig[];
  selectedChartId: string;
  setViewMode: (mode: ViewMode) => void;
  setSelectedChartId: (chartId: string) => void;
  subscribeToMarket: (config: MarketConfig, chartId?: string) => void;
  fetchHistoricalData: (timeRange: TimeRange, chartId?: string) => void;
  resetToRealTime: () => void;
}

const MultiChartContext = createContext<MultiChartContextType | null>(null);

export const useMultiChart = () => {
  const context = useContext(MultiChartContext);
  if (!context) {
    throw new Error('useMultiChart must be used within a MultiChartProvider');
  }
  return context;
};

interface MultiChartProviderProps {
  children: ReactNode;
}

const KlineInterval = {
  ONE_MINUTE: 'ONE_MINUTE',
  FIVE_MINUTES: 'FIVE_MINUTES', 
  FIFTEEN_MINUTES: 'FIFTEEN_MINUTES',
  ONE_HOUR: 'ONE_HOUR',
} as const;

type KlineInterval = typeof KlineInterval[keyof typeof KlineInterval];

const convertToGraphQLInterval = (interval: string): KlineInterval => {
  const mapping: Record<string, KlineInterval> = {
    '1m': KlineInterval.ONE_MINUTE,
    '5m': KlineInterval.FIVE_MINUTES,
    '15m': KlineInterval.FIFTEEN_MINUTES,
    '1h': KlineInterval.ONE_HOUR,
  };
  return mapping[interval] || KlineInterval.ONE_MINUTE;
};

const transformKlineToCandle = (kline: any): CandlestickData => ({
  time: Math.floor(kline.openTime / 1000) + (7 * 60 * 60),
  open: parseFloat(kline.open),
  high: parseFloat(kline.high),
  low: parseFloat(kline.low),
  close: parseFloat(kline.close),
  symbol: kline.symbol,
  interval: kline.interval
});

const createDefaultChart = (id: string): ChartConfig => ({
  id,
  market: null,
  candlestickData: [],
  loading: false,
  error: null,
});

export const MultiChartProvider: React.FC<MultiChartProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [selectedChartId, setSelectedChartId] = useState('chart-1');
  const [charts, setCharts] = useState<ChartConfig[]>([
    createDefaultChart('chart-1'),
    createDefaultChart('chart-2'),
    createDefaultChart('chart-3'),
    createDefaultChart('chart-4'),
  ]);
  
  const apolloClient = useApolloClient();

  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  }, []);

  const subscribeToMarket = useCallback(async (config: MarketConfig, chartId?: string) => {
    if (!socket || !connected) {
      console.warn('Socket not connected yet');
      return;
    }
    
    const targetChartId = chartId || selectedChartId;
    const targetChart = charts.find(c => c.id === targetChartId);
    
    if (!targetChart) return;

    updateChart(targetChartId, { loading: true, error: null });

    try {
      // Unsubscribe from current market for this chart
      if (targetChart.market) {
        socket.emit('unsubscribe_market', {
          symbol: targetChart.market.symbol,
          interval: targetChart.market.interval
        });
      }
      
      // Fetch historical data via GraphQL
      const intervalEnum = convertToGraphQLInterval(config.interval);
      const { data } = await apolloClient.query({
        query: GET_LATEST_KLINES,
        variables: {
          symbol: config.symbol,
          interval: intervalEnum,
          limit: 100
        },
        fetchPolicy: 'network-only'
      });
      
      // Transform GraphQL data to candlestick format
      const historicalData = data.getLatestKlines.data.map(transformKlineToCandle);

      // Subscribe to real-time updates
      socket.emit('subscribe_market', {
        symbol: config.symbol,
        interval: config.interval
      });

      updateChart(targetChartId, {
        market: config,
        candlestickData: historicalData,
        loading: false
      });
      
    } catch (error: any) {
      console.error('Error fetching historical data:', error);
      updateChart(targetChartId, {
        error: error.message,
        loading: false
      });
      
      // Fall back to real-time only if GraphQL fails
      socket.emit('subscribe_market', {
        symbol: config.symbol,
        interval: config.interval
      });
      
      updateChart(targetChartId, {
        market: config,
        candlestickData: []
      });
    }
  }, [socket, connected, selectedChartId, charts, apolloClient, updateChart]);

  const fetchHistoricalData = useCallback(async (timeRange: TimeRange, chartId?: string) => {
    const targetChartId = chartId || selectedChartId;
    const targetChart = charts.find(c => c.id === targetChartId);
    
    if (!targetChart?.market) {
      updateChart(targetChartId, { error: 'No market selected' });
      return;
    }

    updateChart(targetChartId, { loading: true, error: null });

    try {
      const intervalEnum = convertToGraphQLInterval(targetChart.market.interval);
      const startTimeMs = timeRange.startTime.getTime();
      const endTimeMs = timeRange.endTime.getTime();
      
      const { data } = await apolloClient.query({
        query: GET_HISTORICAL_KLINES,
        variables: {
          symbol: targetChart.market.symbol,
          interval: intervalEnum,
          startTime: startTimeMs,
          endTime: endTimeMs,
          limit: 1000
        },
        fetchPolicy: 'network-only'
      });

      const historicalData = data.getHistoricalKlines.data.map(transformKlineToCandle);

      updateChart(targetChartId, {
        candlestickData: historicalData,
        loading: false
      });
      
      console.log(`✅ Loaded ${historicalData.length} historical klines for ${targetChart.market.symbol} on ${targetChartId}`);
      
    } catch (error: any) {
      console.error('Error fetching historical data:', error);
      updateChart(targetChartId, {
        error: `Failed to fetch historical data: ${error.message}`,
        loading: false
      });
    }
  }, [selectedChartId, charts, apolloClient, updateChart]);

  const resetToRealTime = useCallback(async () => {
    // Reset all charts to real-time by re-subscribing to their current markets
    for (const chart of charts) {
      if (chart.market && socket && connected) {
        await subscribeToMarket(chart.market, chart.id);
      }
    }
  }, [charts, socket, connected, subscribeToMarket]);

  const handleViewModeChange = useCallback(async (mode: ViewMode) => {
    setViewMode(mode);
    
    // If switching from multi to single, reset to real-time
    if (mode === 'single') {
      await resetToRealTime();
    }
  }, [resetToRealTime]);

  useEffect(() => {
    // Connect to charting service Socket.io server
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      setConnected(true);

      // Initialize first chart with default market
      const defaultMarket: MarketConfig = { 
        symbol: 'BTC/USDT', 
        interval: '1m', 
        displayName: 'BTC/USDT - 1m' 
      };
      
      updateChart('chart-1', { market: defaultMarket });
      subscribeToMarket(defaultMarket, 'chart-1');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
      setConnected(false);
      setCharts(prev => prev.map(chart => ({ ...chart, loading: false })));
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket.io connection error:', err);
      setConnected(false);
      setCharts(prev => prev.map(chart => ({ 
        ...chart, 
        loading: false,
        error: err.message 
      })));
    });

    // Handle real-time candlestick updates
    newSocket.on('candlestick', (data: CandlestickData) => {
      // Convert time from UTC to UTC+7 and ensure it's in seconds
      const normalizedData = {
        ...data,
        time: Math.floor((data.time > 1000000000000 ? data.time / 1000 : data.time) + (7 * 60 * 60))
      };
      
      // Update all charts that are subscribed to this symbol
      setCharts(prev => prev.map(chart => {
        if (!chart.market || data?.symbol !== chart.market?.symbol) {
          return chart;
        }
        
        const updated = [...chart.candlestickData];
        
        // Check if this is an update to the last candlestick (same timestamp)
        if (updated.length > 0 && updated[updated.length - 1].time === normalizedData.time) {
          updated[updated.length - 1] = normalizedData;
        } else {
          if (updated[updated.length - 1] && normalizedData.time < updated[updated.length - 1].time) {
            // Ignore out-of-order data
            return chart;
          }
          updated.push(normalizedData);
        }
        
        // Keep only last 200 candlesticks to prevent memory issues
        return {
          ...chart,
          candlestickData: updated.slice(-200)
        };
      }));
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up Socket.io connection');
      newSocket.disconnect();
    };
  }, []);

  const value = {
    socket,
    connected,
    viewMode,
    charts,
    selectedChartId,
    setViewMode: handleViewModeChange,
    setSelectedChartId,
    subscribeToMarket,
    fetchHistoricalData,
    resetToRealTime
  };

  return (
    <MultiChartContext.Provider value={value}>
      {children}
    </MultiChartContext.Provider>
  );
};