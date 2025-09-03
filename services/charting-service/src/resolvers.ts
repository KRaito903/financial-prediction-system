import { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    getHistoricalKlines: async (_, { symbol, interval, startTime, endTime, limit }, { dataSources }) => {
      return dataSources.binanceAPI.getHistoricalKlines(
        symbol,
        interval,
        startTime,
        endTime,
        limit
      );
    },
    getLatestKlines: async (_, { symbol, interval, limit }, { dataSources }) => {
      return dataSources.binanceAPI.getLatestKlines(symbol, interval, limit);
    },
  },
};