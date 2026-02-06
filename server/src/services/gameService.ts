import { Game, CreateGameRequest } from '../models/Game';
import * as storage from '../utils/fileStorage';
import { isValidGameName, generateGameCode } from '../utils/validation';

async function generateUniqueGameCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 100) {
    const code = generateGameCode();
    const gamePath = storage.getGameFilePath(code);
    const exists = await storage.fileExists(gamePath);
    if (!exists) {
      return code;
    }
    attempts++;
  }
  throw new Error('Unable to generate unique game code after 100 attempts');
}

export async function createGame(data: CreateGameRequest): Promise<Game> {
  // Validate game name
  if (!isValidGameName(data.name)) {
    throw new Error('Invalid game name. Must be 1-100 characters.');
  }

  // Generate unique code
  const code = await generateUniqueGameCode();

  // Create game object with creator as first user
  const game: Game = {
    code,
    name: data.name,
    users: [data.createdBy],
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy,
  };

  // Write to file
  const gamePath = storage.getGameFilePath(code);
  await storage.writeJsonFile(gamePath, game);

  return game;
}

export async function getGameByCode(code: string): Promise<Game | null> {
  const gamePath = storage.getGameFilePath(code);
  return await storage.readJsonFile<Game>(gamePath);
}

export async function listGamesByUser(username: string): Promise<Game[]> {
  // List all game files
  const gameFiles = await storage.listFiles(storage.getGameFilePath('').replace(/[^/]*$/, ''));

  // Read each file and filter by username
  const games: Game[] = [];
  for (const file of gameFiles) {
    if (file.endsWith('.json')) {
      const code = file.replace('.json', '');
      const game = await getGameByCode(code);
      if (game && game.users.includes(username)) {
        games.push(game);
      }
    }
  }

  return games;
}

export async function addUserToGame(code: string, username: string): Promise<void> {
  // Get game
  const game = await getGameByCode(code);
  if (!game) {
    throw new Error('Game not found');
  }

  // Check if user already in game
  if (game.users.includes(username)) {
    throw new Error('User already in game');
  }

  // Add username to users array
  game.users.push(username);

  // Write updated game
  const gamePath = storage.getGameFilePath(code);
  await storage.writeJsonFile(gamePath, game);
}
