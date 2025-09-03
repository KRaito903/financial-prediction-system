import { BinanceAPI } from "./datasources/binance-api";

export type DataSourceContext = {
  dataSources: {
    binanceAPI: BinanceAPI;
  };
};