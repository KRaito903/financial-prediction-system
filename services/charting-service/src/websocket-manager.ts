import WebSocket from "ws";
import { broadcastCandlestick, broadcastTrade } from "./socket";

interface MarketStream {
  symbol: string;
  interval: string;
  websocket: WebSocket | null;
  subscribers: number;
}

interface TradeStream {
  symbol: string;
  websocket: WebSocket | null;
  subscribers: number;
}
class WebSocketManager {
  private streams: Map<string, MarketStream> = new Map();
  private tradeStreams: Map<string, TradeStream> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private tradeReconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000;
  
  getActiveStreams(): string[] {
    return Array.from(this.streams.keys());
  }

  closeAllStreams(): void {
    console.log('🔌 Closing all WebSocket connections...');
    for (const [, stream] of this.streams) {
      stream.websocket?.close();
    }
    for (const [, tradeStream] of this.tradeStreams) {
      tradeStream.websocket?.close();
    }
    this.streams.clear();
    this.tradeStreams.clear();
    this.reconnectAttempts.clear();
    this.tradeReconnectAttempts.clear();
  }

  unsubscribeFromMarket(symbol: string, interval: string) {
    const streamKey = `${symbol.toLowerCase().replace('/','')}@kline_${interval}`;
    if (!this.streams.has(streamKey)) {
      console.warn(`⚠️ No active subscription for ${streamKey} to unsubscribe`);
      return;
    }

    const stream = this.streams.get(streamKey)!;
    stream.subscribers -= 1;

    if (stream.subscribers <= 0) {
      // No more subscribers, close the WebSocket connection
      stream.websocket?.close();
      this.streams.delete(streamKey);
      this.reconnectAttempts.delete(streamKey);
      console.log(`🛑 Unsubscribed from ${streamKey} and closed connection`);
    } else {
      console.log(`🔔 Decremented subscriber for ${streamKey}. Remaining subscribers: ${stream.subscribers}`);
    }
  }

  subscribeToMarket(symbol: string, interval: string) {
    const streamKey = `${symbol.toLowerCase().replace('/','')}@kline_${interval}`;
    if (this.streams.has(streamKey)) {
      // Already subscribed, increment subscriber count
      const stream = this.streams.get(streamKey)!;
      stream.subscribers += 1;
      console.log(`🔔 Incremented subscriber for ${streamKey}. Total subscribers: ${stream.subscribers}`);
      return;
    }

    const wsUrl = `wss://stream.binance.com:9443/ws/${streamKey}`;
    const ws = new WebSocket(wsUrl);

    const stream: MarketStream = {
      symbol,
      interval,
      websocket: ws,
      subscribers: 1
    };

    this.setupWebSocketHandlers(ws, streamKey, stream);
    this.streams.set(streamKey, stream);
    this.reconnectAttempts.set(streamKey, 0);
  }

  private setupWebSocketHandlers(ws: WebSocket, streamKey: string, stream: MarketStream) {
    ws.on('open', () => {
      console.log(`✅ Connected to Binance stream: ${streamKey}`);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.e === 'kline' && message.k.x === true) { // Ensure kline is closed
          const kline = message.k;
          const candlestick = {
            time: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            symbol: stream.symbol,
            interval: stream.interval
          };
          broadcastCandlestick(candlestick);
        } else if (message.e === 'trade') {
          const trade = {
            symbol: stream.symbol,
            price: parseFloat(message.p),
            amount: parseFloat(message.q),
            time: message.T,
            isBuyerMaker: message.m
          };
          broadcastTrade(trade);
        }
      } catch (err) {
        console.error('❌ Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`❌ Disconnected from Binance stream: ${streamKey}`);
      if (this.streams.has(streamKey)) {
        this.handleReconnection(streamKey, stream);
      }
    });

    ws.on('error', (err) => {
      console.error(`❌ WebSocket error on stream ${streamKey}:`, err);
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

  subscribeToTrades(symbol: string) {
    const streamKey = `${symbol.toLowerCase().replace('/','')}@trade`;
    if (this.tradeStreams.has(streamKey)) {
      const stream = this.tradeStreams.get(streamKey)!;
      stream.subscribers += 1;
      console.log(`🔔 Incremented trade subscriber for ${streamKey}. Total subscribers: ${stream.subscribers}`);
      return;
    }

    const wsUrl = `wss://stream.binance.com:9443/ws/${streamKey}`;
    const ws = new WebSocket(wsUrl);

    const tradeStream: TradeStream = {
      symbol,
      websocket: ws,
      subscribers: 1
    };

    this.setupTradeWebSocketHandlers(ws, streamKey, tradeStream);
    this.tradeStreams.set(streamKey, tradeStream);
    this.tradeReconnectAttempts.set(streamKey, 0);
  }

  unsubscribeFromTrades(symbol: string) {
    const streamKey = `${symbol.toLowerCase().replace('/','')}@trade`;
    if (!this.tradeStreams.has(streamKey)) {
      console.warn(`⚠️ No active trade subscription for ${streamKey} to unsubscribe`);
      return;
    }

    const stream = this.tradeStreams.get(streamKey)!;
    stream.subscribers -= 1;

    if (stream.subscribers <= 0) {
      stream.websocket?.close();
      this.tradeStreams.delete(streamKey);
      this.tradeReconnectAttempts.delete(streamKey);
      console.log(`🛑 Unsubscribed from trade ${streamKey} and closed connection`);
    } else {
      console.log(`🔔 Decremented trade subscriber for ${streamKey}. Remaining subscribers: ${stream.subscribers}`);
    }
  }

  private setupTradeWebSocketHandlers(ws: WebSocket, streamKey: string, stream: TradeStream) {
    ws.on('open', () => {
      console.log(`✅ Connected to Binance trade stream: ${streamKey}`);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.e === 'trade') {
          const trade = {
            symbol: stream.symbol,
            price: parseFloat(message.p),
            amount: parseFloat(message.q),
            time: message.T,
            isBuyerMaker: message.m
          };
          broadcastTrade(trade);
        }
      } catch (err) {
        console.error('❌ Error parsing trade message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`❌ Disconnected from Binance trade stream: ${streamKey}`);
      if (this.tradeStreams.has(streamKey)) {
        this.handleTradeReconnection(streamKey, stream);
      }
    });

    ws.on('error', (err) => {
      console.error(`❌ WebSocket error on trade stream ${streamKey}:`, err);
    });
  }

  private handleTradeReconnection(streamKey: string, stream: TradeStream): void {
    const attempts = this.tradeReconnectAttempts.get(streamKey) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.tradeReconnectAttempts.set(streamKey, attempts + 1);
      
      console.log(`🔄 Attempting to reconnect trade ${streamKey} (${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        if (this.tradeStreams.has(streamKey)) {
          const wsUrl = `wss://stream.binance.com:9443/ws/${streamKey}`;
          const newWs = new WebSocket(wsUrl);
          stream.websocket = newWs;
          this.setupTradeWebSocketHandlers(newWs, streamKey, stream);
        }
      }, this.RECONNECT_DELAY * (attempts + 1));
    } else {
      console.error(`❌ Max reconnection attempts reached for trade ${streamKey}`);
      this.tradeStreams.delete(streamKey);
      this.tradeReconnectAttempts.delete(streamKey);
    }
  }
}

export const wsManager = new WebSocketManager();