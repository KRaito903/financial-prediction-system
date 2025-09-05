import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import path from "path";
import { gql } from "graphql-tag";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { BinanceAPI } from "./datasources/binance-api";
import { InfluxDBAPI } from "./datasources/influxdb-api";
import { getInfluxDBConfig, validateInfluxDBConfig } from "./config/influxdb";
import { resolvers } from "./resolvers";

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, "./market-data-schema.graphql"), {
    encoding: "utf-8",
  })
);

const port = 4002;
const subgraphName = "market-data";

export async function startGraphQLServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  // Initialize InfluxDB if configuration is available
  let influxDB: InfluxDBAPI | null = null;
  if (validateInfluxDBConfig()) {
    try {
      const config = getInfluxDBConfig();
      influxDB = new InfluxDBAPI(config);
      console.log('💾 InfluxDB initialized for persistent caching');
    } catch (error) {
      console.warn('⚠️ Failed to initialize InfluxDB, using in-memory cache only:', error);
    }
  } else {
    console.log('📈 InfluxDB not configured, using in-memory cache only');
  }

  const binanceAPI = new BinanceAPI(influxDB || undefined);

  // Set up cache cleanup interval
  setInterval(() => {
    binanceAPI.clearExpiredCache();
  }, 60000); // Clean up every minute

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources: {
          binanceAPI,
          influxDB,
        },
      };
    },
    listen: { port },
  });

  console.log(`🚀 GraphQL Subgraph ${subgraphName} at ${url}`);
  return server;
}