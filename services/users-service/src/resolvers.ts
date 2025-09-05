import { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    listUsers: async (_, __, { dataSources }) => {
      return await dataSources.usersAPI.listUsers();
    },
    login: async (_, { email, password }, { dataSources }) => {
      return await dataSources.usersAPI.login(email, password);
    },
  },
  Mutation: {
    signup: async (_, { email, password }, { dataSources }) => {
      return await dataSources.usersAPI.signup(email, password);
    },
  },
};
