import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { gql } from "graphql-tag";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefs = gql(
	readFileSync(
		join(
			__dirname,
			process.env.BACKTEST_GRAPHQL_SCHEMA || "models",
			process.env.BACKTEST_GRAPHQL_SCHEMA_FILE || "backtest-schema.graphql"
		),
		{ encoding: "utf8" }
	)
);

const port = process.env.BACKTEST_PORT || 3636;

async function startServer() {
	const server = new ApolloServer({
		schema: buildSubgraphSchema([{ typeDefs }]),
	});
	const { url } = await startStandaloneServer(server, {
		listen: { port: Number(port) },
	});
	console.log(`
    🚀  Server is running at port ${port}
    📭  Query at ${url}
  `);
}

startServer().catch((error) => {
	console.error("Error starting server:", error);
	process.exit(1);
});
