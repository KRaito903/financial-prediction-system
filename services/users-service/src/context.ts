import { UsersPrismaAPI } from "./datasources/users-prisma";

export type DataSourceContext = {
  dataSources: {
    usersAPI: UsersPrismaAPI;
  };
};
