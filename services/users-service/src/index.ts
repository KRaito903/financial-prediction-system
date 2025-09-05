import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { UsersPrismaAPI } from "./datasources/users-prisma";
import { resolvers } from "./resolvers";
import { readFileSync } from "fs";

import path from "path";
import { gql } from "graphql-tag";
import { buildSubgraphSchema } from "@apollo/subgraph";

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, "./users-schema.graphql"), {
    encoding: "utf-8",
  })
);

const port = 4001;
const subgraphName = "users";

async function startApolloServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });
  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources: {
          usersAPI: new UsersPrismaAPI(),
        },
      };
    },
    listen: { port },
  });
  console.log(`🚀 Subgraph ${subgraphName} at ${url}`);
}

startApolloServer();
