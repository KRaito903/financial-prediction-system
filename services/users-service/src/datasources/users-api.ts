import { users } from "./users_data.json";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface AuthPayload {
  success: boolean;
  message: string;
  user?: User;
}

export class UsersAPI {
  private users: User[] = users;

  listUsers() {
    return this.users;
  }

  login(username: string, password: string): AuthPayload {
    const user = this.users.find(u => u.username === username);
    
    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        message: "Invalid password"
      };
    }

    return {
      success: true,
      message: "Login successful",
      user
    };
  }

  signup(username: string, password: string, name: string, email: string): AuthPayload {
    const existingUser = this.users.find(u => u.username === username || u.email === email);
    
    if (existingUser) {
      return {
        success: false,
        message: "Username or email already exists"
      };
    }

    const newUser: User = {
      id: (this.users.length + 1).toString(),
      username,
      password,
      name,
      email
    };

    this.users.push(newUser);

    return {
      success: true,
      message: "Signup successful",
      user: newUser
    };
  }

  listUsersByName(name: string) {
    return users.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
  }
}
