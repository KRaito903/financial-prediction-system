import { Server } from "socket.io";
import { wsManager } from "./websocket-manager";

// Store recent candlestick data for new connections
const recentCandlesticks: Array<{time: number, open: number, high: number, low: number, close: number}> = [];
const MAX_HISTORY = 100; // Keep last 100 candlesticks

const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);
  console.log('👥 Total clients:', io.sockets.sockets.size);

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    console.log('👥 Total clients:', io.sockets.sockets.size);
  });

  socket.on('subscribe_market', ({symbol, interval}) => {
    wsManager.subscribeToMarket(symbol, interval);
  })

  socket.on('unsubscribe_market', ({symbol, interval}) => {
    wsManager.unsubscribeFromMarket(symbol, interval);
  })

});

// Function to broadcast candlestick data
export const broadcastCandlestick = (candlestick: {time: number, open: number, high: number, low: number, close: number, symbol: string, interval: string}) => {
  // Add to recent candlesticks buffer
  recentCandlesticks.push(candlestick);
  
  // Keep only last MAX_HISTORY candlesticks
  if (recentCandlesticks.length > MAX_HISTORY) {
    recentCandlesticks.shift();
  }
  
  // Broadcast to all connected clients
  io.emit('candlestick', candlestick);
};

export { io };
