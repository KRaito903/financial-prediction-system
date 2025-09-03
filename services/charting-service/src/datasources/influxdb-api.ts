import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { Kline, KlineResponse } from './binance-api';

interface InfluxDBRow {
  _time: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  quoteAssetVolume?: number;
  trades?: number;
  takerBuyBaseAssetVolume?: number;
  takerBuyQuoteAssetVolume?: number;
  closeTime?: number;
  symbol: string;
  interval: string;
}

export interface InfluxDBConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export class InfluxDBAPI {
  private client: InfluxDB;
  private config: InfluxDBConfig;

  constructor(config: InfluxDBConfig) {
    this.config = config;
    this.client = new InfluxDB({
      url: config.url,
      token: config.token,
    });
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

  async writeKlines(klines: Kline[]): Promise<void> {
    if (klines.length === 0) return;

    const writeAPI = this.client.getWriteApi(this.config.org, this.config.bucket);
    
    try {
      const points = klines.map(kline => {
        return new Point('klines')
          .tag('symbol', kline.symbol)
          .tag('interval', this.convertInterval(kline.interval))
          .floatField('open', parseFloat(kline.open))
          .floatField('high', parseFloat(kline.high))
          .floatField('low', parseFloat(kline.low))
          .floatField('close', parseFloat(kline.close))
          .floatField('volume', parseFloat(kline.volume))
          .floatField('quoteAssetVolume', parseFloat(kline.quoteAssetVolume))
          .intField('trades', kline.trades)
          .floatField('takerBuyBaseAssetVolume', parseFloat(kline.takerBuyBaseAssetVolume))
          .floatField('takerBuyQuoteAssetVolume', parseFloat(kline.takerBuyQuoteAssetVolume))
          .intField('closeTime', kline.closeTime)
          .timestamp(new Date(kline.openTime));
      });
      console.log(points);
      writeAPI.writePoints(points);
      await writeAPI.close();
      
      console.log(`💾 Stored ${klines.length} klines in InfluxDB for ${klines[0].symbol} ${klines[0].interval}`);
    } catch (error) {
      console.error('❌ Error writing to InfluxDB:', error);
      throw error;
    }
  }

  async queryKlines(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number,
    limit?: number
  ): Promise<KlineResponse | null> {
    const queryAPI = this.client.getQueryApi(this.config.org);
    const binanceInterval = this.convertInterval(interval);
    
    try {
      let fluxQuery = `
        from(bucket: "${this.config.bucket}")
          |> range(start: ${startTime ? new Date(startTime).toISOString() : '-30d'}, stop: ${endTime ? new Date(endTime).toISOString() : 'now()'})
          |> filter(fn: (r) => r._measurement == "klines")
          |> filter(fn: (r) => r.symbol == "${symbol}")
          |> filter(fn: (r) => r.interval == "${binanceInterval}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"])
      `;

      if (limit) {
        fluxQuery += `|> limit(n: ${limit})`;
      }

      const rows: InfluxDBRow[] = [];
      
      return new Promise((resolve, reject) => {
        queryAPI.queryRows(fluxQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            rows.push(o);
          },
          error(error) {
            console.error('❌ InfluxDB query error:', error);
            reject(error);
          },
          complete() {
            if (rows.length === 0) {
              resolve(null);
              return;
            }

            const klines: Kline[] = rows.map(row => ({
              openTime: new Date(row._time).getTime(),
              open: row.open?.toString() || '0',
              high: row.high?.toString() || '0',
              low: row.low?.toString() || '0',
              close: row.close?.toString() || '0',
              volume: row.volume?.toString() || '0',
              closeTime: row.closeTime || new Date(row._time).getTime() + 60000,
              quoteAssetVolume: row.quoteAssetVolume?.toString() || '0',
              trades: row.trades || 0,
              takerBuyBaseAssetVolume: row.takerBuyBaseAssetVolume?.toString() || '0',
              takerBuyQuoteAssetVolume: row.takerBuyQuoteAssetVolume?.toString() || '0',
              symbol,
              interval: binanceInterval
            }));

            const response: KlineResponse = {
              data: klines,
              count: klines.length,
              symbol,
              interval: binanceInterval,
              startTime,
              endTime
            };
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error querying InfluxDB:', error);
      return null;
    }
  }

  async hasData(
    symbol: string,
    interval: string,
    startTime?: number,
    endTime?: number
  ): Promise<boolean> {
    const queryAPI = this.client.getQueryApi(this.config.org);
    const binanceInterval = this.convertInterval(interval);
    
    try {
      const fluxQuery = `
        from(bucket: "${this.config.bucket}")
          |> range(start: ${startTime ? new Date(startTime).toISOString() : '-30d'}, stop: ${endTime ? new Date(endTime).toISOString() : 'now()'})
          |> filter(fn: (r) => r._measurement == "klines")
          |> filter(fn: (r) => r.symbol == "${symbol}")
          |> filter(fn: (r) => r.interval == "${binanceInterval}")
          |> filter(fn: (r) => r._field == "close")
          |> count()
      `;

      return new Promise((resolve, reject) => {
        let count = 0;
        queryAPI.queryRows(fluxQuery, {
          next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            count = o._value || 0;
          },
          error(error) {
            console.error('❌ InfluxDB count query error:', error);
            reject(error);
          },
          complete() {
            resolve(count > 0);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error checking InfluxDB data:', error);
      return false;
    }
  }

  async getDataGaps(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<{ start: number; end: number }[]> {
    const binanceInterval = this.convertInterval(interval);
    const intervalMs = this.getIntervalMilliseconds(binanceInterval);
    
    const result = await this.queryKlines(symbol, interval, startTime, endTime);
    if (!result || result.data.length === 0) {
      return [{ start: startTime, end: endTime }];
    }

    const gaps: { start: number; end: number }[] = [];
    const sortedData = result.data.sort((a, b) => a.openTime - b.openTime);
    
    // Check gap at the beginning
    if (sortedData[0].openTime > startTime) {
      gaps.push({ start: startTime, end: sortedData[0].openTime - intervalMs });
    }

    // Check gaps between existing data points
    for (let i = 0; i < sortedData.length - 1; i++) {
      const currentEnd = sortedData[i].openTime + intervalMs;
      const nextStart = sortedData[i + 1].openTime;
      
      if (nextStart > currentEnd) {
        gaps.push({ start: currentEnd, end: nextStart - intervalMs });
      }
    }

    // Check gap at the end
    const lastDataPoint = sortedData[sortedData.length - 1];
    const lastExpectedTime = lastDataPoint.openTime + intervalMs;
    if (lastExpectedTime < endTime) {
      gaps.push({ start: lastExpectedTime, end: endTime });
    }

    return gaps;
  }

  private getIntervalMilliseconds(interval: string): number {
    const intervalMap: Record<string, number> = {
      '1s': 1000,
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    return intervalMap[interval] || 60 * 1000; // Default to 1 minute
  }

  async close() {
    console.log('🔌 InfluxDB client closed');
  }
}