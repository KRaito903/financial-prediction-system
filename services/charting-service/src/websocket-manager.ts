import WebSocket from 'ws';
import { broadcastCandlestick } from './socket';

interface MarketStream {
  symbol: string;
  interval: string;
  websocket: WebSocket | null;
  subscribers: number;
}

class WebSocketManager {
  private streams: Map<string, MarketStream> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000;

  generateStreamKey(symbol: string, interval: string): string {
    return `${symbol.toLowerCase()}@kline_${interval}`;
  }

  subscribeToMarket(symbol: string, interval: string): void {
    const streamKey = this.generateStreamKey(symbol, interval);
    
    if (this.streams.has(streamKey)) {
      const stream = this.streams.get(streamKey)!;
      stream.subscribers++;
      console.log(`📈 Added subscriber to ${streamKey}. Total: ${stream.subscribers}`);
      return;
    }

    console.log(`🔗 Creating new WebSocket connection for ${streamKey}`);
    const wsUrl = `wss://fstream.binance.com/ws/${streamKey}`;
    const ws = new WebSocket(wsUrl);

    const stream: MarketStream = {
      symbol,
      interval,
      websocket: ws,
      subscribers: 1
    };

    this.setupWebSocketHandlers(ws, streamKey, stream);
    this.streams.set(streamKey, stream);
  }

  unsubscribeFromMarket(symbol: string, interval: string): void {
    const streamKey = this.generateStreamKey(symbol, interval);
    const stream = this.streams.get(streamKey);

    if (!stream) return;

    stream.subscribers--;
    console.log(`📉 Removed subscriber from ${streamKey}. Remaining: ${stream.subscribers}`);

    if (stream.subscribers <= 0) {
      console.log(`🔌 Closing WebSocket connection for ${streamKey}`);
      stream.websocket?.close();
      this.streams.delete(streamKey);
      this.reconnectAttempts.delete(streamKey);
    }
  }

  private setupWebSocketHandlers(ws: WebSocket, streamKey: string, stream: MarketStream): void {
    ws.on('open', () => {
      console.log(`✅ Connected to Binance WebSocket: ${streamKey}`);
      this.reconnectAttempts.set(streamKey, 0);
      // broadcastMarketChange(stream.symbol, stream.interval, 'connected');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.e === 'kline' && message.k) {
          const kline = message.k;
          
          const candlestick = {
            time: Math.floor(message.E / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            symbol: stream.symbol,
            interval: stream.interval
          };
          
          console.log(`📊 ${streamKey} candlestick:`, candlestick);
          broadcastCandlestick(candlestick);
        }
      } catch (error) {
        console.error(`❌ Error parsing WebSocket data for ${streamKey}:`, error);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${streamKey}:`, error);
      // broadcastMarketChange(stream.symbol, stream.interval, 'error');
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed for ${streamKey}: ${code} - ${reason}`);
      // broadcastMarketChange(stream.symbol, stream.interval, 'disconnected');
      
      if (this.streams.has(streamKey)) {
        this.handleReconnection(streamKey, stream);
      }
    });
  }

  private handleReconnection(streamKey: string, stream: MarketStream): void {
    const attempts = this.reconnectAttempts.get(streamKey) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(streamKey, attempts + 1);
      
      console.log(`🔄 Attempting to reconnect ${streamKey} (${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        if (this.streams.has(streamKey)) {
          const wsUrl = `wss://fstream.binance.com/ws/${streamKey}`;
          const newWs = new WebSocket(wsUrl);
          stream.websocket = newWs;
          this.setupWebSocketHandlers(newWs, streamKey, stream);
        }
      }, this.RECONNECT_DELAY * (attempts + 1));
    } else {
      console.error(`❌ Max reconnection attempts reached for ${streamKey}`);
      this.streams.delete(streamKey);
      this.reconnectAttempts.delete(streamKey);
    }
  }

  getActiveStreams(): string[] {
    return Array.from(this.streams.keys());
  }

  closeAllStreams(): void {
    console.log('🔌 Closing all WebSocket connections...');
    for (const [streamKey, stream] of this.streams) {
      stream.websocket?.close();
    }
    this.streams.clear();
    this.reconnectAttempts.clear();
  }
}

export const wsManager = new WebSocketManager();