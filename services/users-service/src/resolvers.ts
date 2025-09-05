import { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    listUsers: (_, __, { dataSources }) => {
      return dataSources.usersAPI.listUsers();
    },
    login: (_, { username, password }, { dataSources }) => {
      return dataSources.usersAPI.login(username, password);
    },
  },
  Mutation: {
    signup: (_, { username, password, name, email }, { dataSources }) => {
      return dataSources.usersAPI.signup(username, password, name, email);
    },
  },
};
