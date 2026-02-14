import { User, CreateUserRequest } from '../models/User';
import * as storage from '../utils/fileStorage';
import { isValidUsername, isValidDisplayName } from '../utils/validation';

export async function createUser(data: CreateUserRequest): Promise<User> {
  // Validate username format
  if (!isValidUsername(data.username)) {
    throw new Error('Invalid username format. Must be 3-20 alphanumeric characters or underscores.');
  }

  // Validate display name
  if (!isValidDisplayName(data.displayName)) {
    throw new Error('Invalid display name. Must be 1-50 characters.');
  }

  // Check if user already exists
  const userPath = storage.getUserFilePath(data.username);
  const existingUser = await storage.readJsonFile<User>(userPath);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Create user object
  const user: User = {
    username: data.username,
    displayName: data.displayName,
    passwordHash: data.passwordHash,
    salt: data.salt,
    createdAt: new Date().toISOString(),
  };

  // Write to file
  await storage.writeJsonFile(userPath, user);

  return user;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const userPath = storage.getUserFilePath(username);
  return await storage.readJsonFile<User>(userPath);
}

export async function getUserSalt(username: string): Promise<string | null> {
  const user = await getUserByUsername(username);
  return user ? user.salt : null;
}

export async function validateLogin(username: string, passwordHash: string): Promise<boolean> {
  const user = await getUserByUsername(username);
  if (!user) {
    return false;
  }
  return !user.passwordHash || user.passwordHash === passwordHash;
}
