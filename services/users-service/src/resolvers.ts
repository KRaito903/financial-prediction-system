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
    changePassword: async (_, { input }, { dataSources }) => {
      if (!input.userId) {
        return {
          success: false,
          message: "Authentication required"
        };
      }
      return await dataSources.usersAPI.changePassword(input.userId, input.newPassword);
    },
    changeEmail: async (_, { input }, { dataSources }) => {
      if (!input.userId) {
        return {
          success: false,
          message: "Authentication required"
        };
      }
      return await dataSources.usersAPI.changeEmail(input.userId, input.newEmail);
    },
    deleteAccount: async (_, { input }, { dataSources }) => {
      if (!input.userId) {
        return {
          success: false,
          message: "Authentication required"
        };
      }
      return await dataSources.usersAPI.deleteAccount(input.userId);
    },
  },
};
