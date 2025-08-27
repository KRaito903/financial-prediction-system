import WebSocket from 'ws';
import { broadcastCandlestick } from './socket';

const BINANCE_WS_URL = 'wss://fstream.binance.com/ws/btcusdt@kline_15m';

console.log('🚀 Starting Charting Service...');
console.log('📡 Socket.io server running on port 3000');
console.log('🔗 Connecting to Binance WebSocket...');
const ws = new WebSocket(BINANCE_WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to Binance WebSocket');
});

let prevtime = 0;

ws.on('message', (data) => {
  try {
  const message = JSON.parse(data.toString());
    
    if (message.e === 'kline' && message.k) {
      const kline = message.k;
      
      // Transform Binance kline data to candlestick format
      const candlestick = {
        time: Math.floor(message.E / 1000), // Convert milliseconds to seconds
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c)
      };
      
      console.log('📊 Candlestick data:', candlestick);
      
      // Broadcast to all connected Socket.io clients
      if (candlestick.time !== prevtime) {
        broadcastCandlestick(candlestick);
        prevtime = candlestick.time;
      }
    }
  } catch (error) {
    console.error('❌ Error parsing WebSocket data:', error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
});




