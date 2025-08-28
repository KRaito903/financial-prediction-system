import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const backtestLink = createHttpLink({
  uri: 'http://localhost:5050/graphql',
});
export const backtestClient = new ApolloClient({
  link: backtestLink, // You can switch between backtestLink and binanceLink as needed
  cache: new InMemoryCache(),
});