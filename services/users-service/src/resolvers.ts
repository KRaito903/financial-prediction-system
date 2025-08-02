import { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    listUsers: (_, __, { dataSources }) => {
      return dataSources.usersAPI.listUsers();
    },
  },
};
