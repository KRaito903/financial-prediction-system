import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ReactNode } from 'react';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  candlestickData: CandlestickData[];
  error: string | null;
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

  useEffect(() => {
    // Connect to charting service Socket.io server
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket.io connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    // Handle historical data when first connecting
    newSocket.on('historical_data', (data: CandlestickData[]) => {
      console.log(`📤 Received ${data.length} historical candlesticks`);
      setCandlestickData(data);
    });

    // Handle real-time candlestick updates
    newSocket.on('candlestick', (data: CandlestickData) => {
      console.log('📊 Received real-time candlestick:', data);
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
  }, []);

  const value = {
    socket,
    connected,
    candlestickData,
    error,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};