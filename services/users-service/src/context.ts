import { UsersAPI } from "./datasources/users-api";

export type DataSourceContext = {
  dataSources: {
    usersAPI: UsersAPI;
  };
};
