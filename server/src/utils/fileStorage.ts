import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const GAMES_DIR = path.join(DATA_DIR, 'games');

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDirectoryExists(dir);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    await ensureDirectoryExists(dirPath);
    return await fs.readdir(dirPath);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

export function getUserFilePath(username: string): string {
  // Validate to prevent path traversal
  if (username.includes('..') || username.includes('/') || username.includes('\\')) {
    throw new Error('Invalid username: contains illegal characters');
  }
  return path.join(USERS_DIR, `${username}.json`);
}

export function getGameFilePath(code: string): string {
  // Validate to prevent path traversal
  if (code.includes('..') || code.includes('/') || code.includes('\\')) {
    throw new Error('Invalid game code: contains illegal characters');
  }
  return path.join(GAMES_DIR, `${code}.json`);
}
