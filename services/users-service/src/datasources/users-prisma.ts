import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { User, AuthPayload, SettingsPayload } from '../types';

export class UsersPrismaAPI {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async listUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return users.map(user => ({
      id: user.id.toString(),
      email: user.email,
      password: user.password,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }

  async login(email: string, password: string): Promise<AuthPayload> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: "Invalid password"
        };
      }

      return {
        success: true,
        message: "Login successful",
        user: {
          id: user.id.toString(),
          email: user.email,
          password: user.password,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Login failed"
      };
    }
  }

  async signup(email: string, password: string): Promise<AuthPayload> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return {
          success: false,
          message: "Email already exists"
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      return {
        success: true,
        message: "Signup successful",
        user: {
          id: newUser.id.toString(),
          email: newUser.email,
          password: newUser.password,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Signup failed"
      };
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<SettingsPayload> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await this.prisma.user.update({
        where: { id: parseInt(userId) },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: "Password updated successfully",
        user: {
          id: updatedUser.id.toString(),
          email: updatedUser.email,
          password: updatedUser.password,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString(),
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update password"
      };
    }
  }

  async changeEmail(userId: string, newEmail: string): Promise<SettingsPayload> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser && existingUser.id.toString() !== userId) {
        return {
          success: false,
          message: "Email already exists"
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: parseInt(userId) },
        data: { email: newEmail },
      });

      return {
        success: true,
        message: "Email updated successfully",
        user: {
          id: updatedUser.id.toString(),
          email: updatedUser.email,
          password: updatedUser.password,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString(),
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update email"
      };
    }
  }

  async deleteAccount(userId: string): Promise<SettingsPayload> {
    try {
      await this.prisma.user.delete({
        where: { id: parseInt(userId) },
      });

      return {
        success: true,
        message: "Account deleted successfully"
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete account"
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}