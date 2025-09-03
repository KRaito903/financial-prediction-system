import { ApolloClient, InMemoryCache, createHttpLink, split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

const backtestLink = createHttpLink({
    uri: "http://127.0.0.1:5050/graphql",
});

const authLink = createHttpLink({
    uri: "http://localhost:4001/graphql",
});

// Split link: route based on operation type or custom context
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        const operationName = definition.name?.value;
        // Route to backtest if operation name includes "Backtest", "Run", or is "FetchTradingPairs"
        return (
            operationName?.includes("Backtest") ||
            operationName?.startsWith("Run") ||
            operationName === "FetchTradingPairs" ||
            false
        );
    },
    backtestLink,
    authLink
);

export const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});