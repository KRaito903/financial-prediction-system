import { Server } from "socket.io";

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

  // Send recent candlesticks to newly connected client
  if (recentCandlesticks.length > 0) {
    socket.emit('historical_data', recentCandlesticks);
    console.log(`📤 Sent ${recentCandlesticks.length} historical candlesticks to ${socket.id}`);
  }

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    console.log('👥 Total clients:', io.sockets.sockets.size);
  });
});

// Function to broadcast candlestick data
export const broadcastCandlestick = (candlestick: {time: number, open: number, high: number, low: number, close: number}) => {
  // Add to recent candlesticks buffer
  recentCandlesticks.push(candlestick);
  
  // Keep only last MAX_HISTORY candlesticks
  if (recentCandlesticks.length > MAX_HISTORY) {
    recentCandlesticks.shift();
  }
  
  // Broadcast to all connected clients
  io.emit('candlestick', candlestick);
  console.log(`📡 Broadcasted candlestick to ${io.sockets.sockets.size} clients`);
};

export { io };
