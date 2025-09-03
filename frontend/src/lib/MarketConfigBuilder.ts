import { type MarketConfig } from "../components/MarketSelector";

export interface MarketEndpoint {
  websocket: string;
  historical: string;
}

export interface ExtendedMarketConfig extends MarketConfig {
  endpoints: MarketEndpoint;
  isValid: boolean;
  binanceSymbol?: string;
}

export class MarketConfigBuilder {
  private config: Partial<ExtendedMarketConfig> = {};

  static create(): MarketConfigBuilder {
    return new MarketConfigBuilder();
  }

  symbol(symbol: string): MarketConfigBuilder {
    this.config.symbol = symbol;
    this.config.binanceSymbol = symbol.replace('/', '');
    return this;
  }

  interval(interval: string): MarketConfigBuilder {
    this.config.interval = interval;
    return this;
  }
  
  withDisplayName(displayName?:string): MarketConfigBuilder {
    if (displayName) {
      this.config.displayName = displayName;
    } else {
      this.config.displayName = `${this.config.symbol} - ${this.config.interval}`;
    }
    return this;
  }
  withEndpoints(): MarketConfigBuilder {
    if (!this.config.symbol || !this.config.interval) {
      throw new Error("Symbol and interval must be set before setting endpoints");
    }
    // For simplicity, we assume all markets use Binance endpoints
    this.config.endpoints = {
      websocket: `wss://stream.binance.com:9443/ws/${this.config.binanceSymbol}@kline_${this.config.interval}`,
      historical: `https://api.binance.com/api/v3/klines?symbol=${this.config.binanceSymbol}&interval=${this.config.interval}&limit=500`
    };
    return this;
  }
  build(): ExtendedMarketConfig {
    if (!this.config.symbol || !this.config.interval) {
      throw new Error("Symbol, interval must be set before building the config");
    }
    if (!this.config.endpoints) {
      this.withEndpoints();
    }
    if (!this.config.displayName) {
      this.withDisplayName();
    }
    this.config.isValid = true;
    return this.config as ExtendedMarketConfig;
  }
}
