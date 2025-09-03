import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import path from "path";
import { gql } from "graphql-tag";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { BinanceAPI } from "./datasources/binance-api";
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

  const binanceAPI = new BinanceAPI();

  // Set up cache cleanup interval
  setInterval(() => {
    binanceAPI.clearExpiredCache();
  }, 60000); // Clean up every minute

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources: {
          binanceAPI,
        },
      };
    },
    listen: { port },
  });

  console.log(`🚀 GraphQL Subgraph ${subgraphName} at ${url}`);
  return server;
}