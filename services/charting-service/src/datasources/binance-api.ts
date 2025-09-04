export interface BinanceKlineRaw {
  0: number;  // Open time
  1: string;  // Open price
  2: string;  // High price
  3: string;  // Low price
  4: string;  // Close price
  5: string;  // Volume
  6: number;  // Close time
  7: string;  // Quote asset volume
  8: number;  // Number of trades
  9: string;  // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Unused field
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  symbol: string;
  interval: string;
}

export interface KlineResponse {
  data: Kline[];
  count: number;
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
}

export enum KlineInterval {
  ONE_SECOND = '1s',
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  SIX_HOURS = '6h',
  EIGHT_HOURS = '8h',
  TWELVE_HOURS = '12h',
  ONE_DAY = '1d',
  THREE_DAYS = '3d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M'
}

import { InfluxDBAPI } from './influxdb-api';

export class BinanceAPI {
  private readonly baseURL = 'https://api.binance.com';
  private readonly cache = new Map<string, { data: KlineResponse; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute cache
  private influxDB: InfluxDBAPI | null = null;

  constructor(influxDB?: InfluxDBAPI) {
    this.influxDB = influxDB || null;
  }

  private convertInterval(interval: string): string {
    const intervalMap: Record<string, string> = {
      'ONE_SECOND': '1s',
      'ONE_MINUTE': '1m',
      'THREE_MINUTES': '3m',
      'FIVE_MINUTES': '5m',
      'FIFTEEN_MINUTES': '15m',
      'THIRTY_MINUTES': '30m',
      'ONE_HOUR': '1h',
      'TWO_HOURS': '2h',
      'FOUR_HOURS': '4h',
      'SIX_HOURS': '6h',
      'EIGHT_HOURS': '8h',
      'TWELVE_HOURS': '12h',
      'ONE_DAY': '1d',
      'THREE_DAYS': '3d',
      'ONE_WEEK': '1w',
      'ONE_MONTH': '1M'
    };
    return intervalMap[interval] || interval;
  }

  private formatSymbol(symbol: string): string {
    // Convert "BTC/USDT" to "BTCUSDT"
    return symbol.replace('/', '').toUpperCase();
  }

  private transformKlineData(
    rawData: BinanceKlineRaw[], 
    symbol: string, 
    interval: string
  ): Kline[] {
    return rawData.map((item) => ({
      openTime: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5],
      closeTime: item[6],
      quoteAssetVolume: item[7],
      trades: item[8],
      takerBuyBaseAssetVolume: item[9],
      takerBuyQuoteAssetVolume: item[10],
      symbol,
      interval
    }));
  }

  private getCacheKey(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): string {
    return `${symbol}-${interval}-${startTime || 'no-start'}-${endTime || 'no-end'}-${limit || 'no-limit'}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  async getHistoricalKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<KlineResponse> {
    // Step 1: Check InfluxDB first if available
    if (this.influxDB) {
      try {
        const influxResult = await this.influxDB.queryKlines(symbol, interval, startTime, endTime, limit);
        if (influxResult && influxResult.data.length > 0) {
          if (startTime && endTime) {
            const gaps = await this.influxDB.getDataGaps(symbol, interval, startTime, endTime);
            
            if (gaps.length === 0) {
              console.log(`💾 Complete data found in InfluxDB for ${symbol} ${interval}`);
              return influxResult;
            } else {
              console.log(`📊 Partial data in InfluxDB, filling ${gaps.length} gaps from Binance API`);
              
              // Fill gaps from Binance API
              const allKlines = [...influxResult.data];
              
              for (const gap of gaps) {
                const gapData = await this.fetchFromBinanceAPI(symbol, interval, gap.start, gap.end);
                if (gapData.data.length > 0) {
                  allKlines.push(...gapData.data);
                  // Store gap data in InfluxDB
                  await this.influxDB.writeKlines(gapData.data);
                }
              }
              
              // Sort and return combined data
              allKlines.sort((a, b) => a.openTime - b.openTime);
              
              return {
                data: limit ? allKlines.slice(0, limit) : allKlines,
                count: limit ? Math.min(allKlines.length, limit) : allKlines.length,
                symbol,
                interval,
                startTime,
                endTime
              };
            }
          }
        } else {
        }
      } catch (error) {
        console.warn('⚠️ InfluxDB query failed, falling back to Binance API:', error);
      }
    }

    // Step 2: Fetch from Binance API (fallback or primary method)
    const result = await this.fetchFromBinanceAPI(symbol, interval, startTime, endTime, limit);
    
    // Step 3: Store in InfluxDB if available and we have data
    if (this.influxDB && result.data.length > 0) {
      try {
        await this.influxDB.writeKlines(result.data);
      } catch (error) {
        console.warn('⚠️ Failed to store data in InfluxDB:', error);
      }
    }

    return result;
  }

  private async fetchFromBinanceAPI(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<KlineResponse> {
    const cacheKey = this.getCacheKey(symbol, interval, startTime, endTime, limit);
    
    // Check in-memory cache first
    if (this.isValidCache(cacheKey)) {
      console.log(`📈 Memory cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey)!.data;
    }

    const formattedSymbol = this.formatSymbol(symbol);
    const binanceInterval = this.convertInterval(interval);
    
    const params = new URLSearchParams({
      symbol: formattedSymbol,
      interval: binanceInterval,
    });

    if (startTime) params.append('startTime', startTime.toString());
    if (endTime) params.append('endTime', endTime.toString());
    if (limit) params.append('limit', limit.toString());

    const url = `${this.baseURL}/api/v3/klines?${params}`;
    
    try {
      console.log(`📈 Fetching from Binance API: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      const rawData: BinanceKlineRaw[] = await response.json();
      const transformedData = this.transformKlineData(rawData, symbol, interval);
      
      const result: KlineResponse = {
        data: transformedData,
        count: transformedData.length,
        symbol,
        interval,
        startTime,
        endTime
      };

      // Cache the result in memory
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
      
    } catch (error) {
      console.error('❌ Error fetching from Binance API:', error);
      throw new Error(`Failed to fetch klines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLatestKlines(
    symbol: string,
    interval: string,
    limit = 100
  ): Promise<KlineResponse> {
    return this.getHistoricalKlines(symbol, interval, undefined, undefined, limit);
  }

  // Clean up old cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}