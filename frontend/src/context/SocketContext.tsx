import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ReactNode } from 'react';
import { type MarketConfig } from '../components/MarketSelector';

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

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentMarket, setCurrentMarket] = useState<MarketConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const subscribeToMarket = useCallback((config: MarketConfig) => {
    if (!socket || !connected) {
      console.warn('Socket not connected yet');
      return;
    }
    setLoading(true);
    setError(null);

    if (currentMarket) {
      socket.emit('unsubscribe_market', {
        symbol: currentMarket.symbol,
        interval: currentMarket.interval
      });
    }

    socket.emit('subscribe_market', {
      symbol: config.symbol,
      interval: config.interval
    });

    setCurrentMarket(config);
    setCandlestickData([]); 
  }, [socket, connected, currentMarket])

  useEffect(() => {
    // Connect to charting service Socket.io server
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      setConnected(true);
      setError(null);

      if (!currentMarket) {
        const defaultMarket: MarketConfig = { symbol: 'BTC/USDT', interval: '1m', displayName: 'BTC/USDT - 1m' };
        newSocket.emit('subscribe_market', {
          symbol: defaultMarket.symbol,
          interval: defaultMarket.interval
        });
        setCurrentMarket(defaultMarket);
        
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
      setCandlestickData(prev => {
        const updated = [...prev];
        
        // Check if this is an update to the last candlestick (same timestamp)
        if (updated.length > 0 && updated[updated.length - 1].time === data.time) {
          updated[updated.length - 1] = data; // Update existing candlestick
        } else {
          updated.push(data); // Add new candlestick
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
  }, [currentMarket]);

  const value = {
    socket,
    connected,
    candlestickData,
    error,
    currentMarket,
    subscribeToMarket,
    loading
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};