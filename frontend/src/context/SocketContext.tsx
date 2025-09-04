import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApolloClient } from '@apollo/client';
import type { ReactNode } from 'react';
import { type MarketConfig } from '../components/MarketSelector';
import { type TimeRange } from '../components/TimeRangeSelector';
import { GET_LATEST_KLINES, GET_HISTORICAL_KLINES } from '../lib/queries';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  symbol?: string;
  interval?: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  candlestickData: CandlestickData[];
  error: string | null;
  currentMarket: MarketConfig | null;
  subscribeToMarket: (config: MarketConfig) => void;
  fetchHistoricalData: (timeRange: TimeRange) => void;
  loading: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
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
  time: Math.floor(kline.openTime / 1000) + (7 * 60 * 60), // Convert from milliseconds to seconds and UTC to UTC+7
  open: parseFloat(kline.open),
  high: parseFloat(kline.high),
  low: parseFloat(kline.low),
  close: parseFloat(kline.close),
  symbol: kline.symbol,
  interval: kline.interval
});

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentMarket, setCurrentMarket] = useState<MarketConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const apolloClient = useApolloClient();

  const subscribeToMarket = useCallback(async (config: MarketConfig) => {
    if (!socket || !connected) {
      console.warn('Socket not connected yet');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Unsubscribe from current market
      if (currentMarket) {
        socket.emit('unsubscribe_market', {
          symbol: currentMarket.symbol,
          interval: currentMarket.interval
        });
      }
      
      // 2. Fetch historical data via GraphQL
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
      

      // 3. Transform GraphQL data to candlestick format
      const historicalData = data.getLatestKlines.data.map(transformKlineToCandle);

      // 4. Set historical data immediately
      setCandlestickData(historicalData);

      // 5. Subscribe to real-time updates
      socket.emit('subscribe_market', {
        symbol: config.symbol,
        interval: config.interval
      });

      setCurrentMarket(config);
      
    } catch (error: any) {
      console.error('Error fetching historical data:', error);
      setError(error.message);
      
      // Fall back to real-time only if GraphQL fails
      socket.emit('subscribe_market', {
        symbol: config.symbol,
        interval: config.interval
      });
      setCandlestickData([]);
      setCurrentMarket(config);
    } finally {
      setLoading(false);
    }
  }, [socket, connected, currentMarket, apolloClient])

  const fetchHistoricalData = useCallback(async (timeRange: TimeRange) => {
    if (!currentMarket) {
      setError('No market selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const intervalEnum = convertToGraphQLInterval(currentMarket.interval);
      const startTimeMs = timeRange.startTime.getTime();
      const endTimeMs = timeRange.endTime.getTime();
      
      const { data } = await apolloClient.query({
        query: GET_HISTORICAL_KLINES,
        variables: {
          symbol: currentMarket.symbol,
          interval: intervalEnum,
          startTime: startTimeMs,
          endTime: endTimeMs,
          limit: 1000
        },
        fetchPolicy: 'network-only'
      });

      // Transform GraphQL data to candlestick format
      const historicalData = data.getHistoricalKlines.data.map(transformKlineToCandle);

      // Set historical data
      setCandlestickData(historicalData);
      
      console.log(`✅ Loaded ${historicalData.length} historical klines for ${currentMarket.symbol}`);
      
    } catch (error: any) {
      console.error('Error fetching historical data:', error);
      setError(`Failed to fetch historical data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentMarket, apolloClient])

  useEffect(() => {
    // Connect to charting service Socket.io server
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      setConnected(true);
      setError(null);

      if (!currentMarket) {
        const defaultMarket: MarketConfig = { symbol: 'BTC/USDT', interval: '1m', displayName: 'BTC/USDT - 1m' };
        setCurrentMarket(defaultMarket);
        
        // Use the new subscribeToMarket function for consistent behavior
        subscribeToMarket(defaultMarket);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
      setConnected(false);
      setLoading(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket.io connection error:', err);
      setError(err.message);
      setConnected(false);
      setLoading(false);
    });

    // Handle real-time candlestick updates
    newSocket.on('candlestick', (data: CandlestickData) => {
      if (currentMarket && data?.symbol !== currentMarket?.symbol) {
        return;
      }
      
      // Convert time from UTC to UTC+7 and ensure it's in seconds
      const normalizedData = {
        ...data,
        time: Math.floor((data.time > 1000000000000 ? data.time / 1000 : data.time) + (7 * 60 * 60))
      };
      
      setCandlestickData(prev => {
        const updated = [...prev];
        
        // Check if this is an update to the last candlestick (same timestamp)
        if (updated.length > 0 && updated[updated.length - 1].time === normalizedData.time) {
          updated[updated.length - 1] = normalizedData; // Update existing candlestick
        } else {
          if (updated[updated.length - 1] && normalizedData.time < updated[updated.length - 1].time) {
            // Ignore out-of-order data
            return updated;
          }
          updated.push(normalizedData); // Add new candlestick
        }
        
        // Keep only last 200 candlesticks to prevent memory issues
        return updated.slice(-200);
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.io connection');
      newSocket.disconnect();
    };
  }, []);

  const value = {
    socket,
    connected,
    candlestickData,
    error,
    currentMarket,
    subscribeToMarket,
    fetchHistoricalData,
    loading
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};