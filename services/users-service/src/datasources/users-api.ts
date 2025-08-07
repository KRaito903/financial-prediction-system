import { users } from "./users_data.json";

export class UsersAPI {
  listUsers() {
    return users;
  }

  listUsersByName(name: string) {
    return users.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  }
}
