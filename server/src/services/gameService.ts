import { Game, PlayerColor, Position } from '../models/Game';
import * as storage from '../utils/fileStorage';
import { isValidGameName, generateGameCode } from '../utils/validation';
import { initializeBoard, initializeTokens } from '../utils/boardUtils';

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

export async function createGame(name: string, createdBy: string): Promise<Game> {
  // Validate game name
  if (!isValidGameName(name)) {
    throw new Error('Invalid game name. Must be 1-100 characters.');
  }

  // Generate unique code
  const code = await generateUniqueGameCode();

  // Create game object in unstarted state
  const game: Game = {
    code,
    name,
    createdAt: new Date().toISOString(),
    createdBy,
    stage: 'unstarted',
    players: [
      // Automatically join the creator with the first available color (red)
      { username: createdBy, color: 'red' }
    ],
    maxPlayers: 4,
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
      if (game && game.players.some(p => p.username === username)) {
        games.push(game);
      }
    }
  }

  return games;
}

export async function addUserToGame(code: string, username: string, color?: PlayerColor): Promise<void> {
  // Get game
  const game = await getGameByCode(code);
  if (!game) {
    throw new Error('Game not found');
  }

  // Check if game has already started
  if (game.stage !== 'unstarted') {
    throw new Error('Cannot join game that has already started');
  }

  // Check if game is full
  if (game.players.length >= game.maxPlayers) {
    throw new Error('Game is full');
  }

  // Check if user already in game
  if (game.players.some(p => p.username === username)) {
    throw new Error('User already in game');
  }

  // Auto-assign color if not provided
  let assignedColor = color;
  if (!assignedColor) {
    const allColors: PlayerColor[] = ['red', 'green', 'blue', 'white'];
    const takenColors = game.players.map(p => p.color);
    const availableColors = allColors.filter(c => !takenColors.includes(c));

    if (availableColors.length === 0) {
      throw new Error('Game is full');
    }

    assignedColor = availableColors[0];
  } else {
    // If color was provided, check if it's already taken
    if (game.players.some(p => p.color === assignedColor)) {
      throw new Error('Color already taken');
    }
  }

  // Add player with assigned color
  game.players.push({ username, color: assignedColor });

  // Write updated game
  const gamePath = storage.getGameFilePath(code);
  await storage.writeJsonFile(gamePath, game);
}

// Start the game - randomizes player order and sets game to playing stage
export async function startGame(code: string, username: string): Promise<void> {
  const game = await getGameByCode(code);
  if (!game) {
    throw new Error('Game not found');
  }

  // Check if the user is the game creator
  if (game.createdBy !== username) {
    throw new Error('Only the game creator can start the game');
  }

  // Check if game is in correct stage
  if (game.stage !== 'unstarted') {
    throw new Error('Game has already started or finished');
  }

  // Check if we have enough players (2-4)
  if (game.players.length < 2) {
    throw new Error('Need at least 2 players to start the game');
  }

  // Randomize player order
  game.players = shuffleArray(game.players);

  // Initialize the board
  const { board, tileInPlay } = initializeBoard();

  // Initialize player positions based on their colors
  // Starting positions: red(2,2), blue(2,4), green(4,2), white(4,4)
  const startingPositions: { [color: string]: Position } = {
    'red': [2, 2],
    'blue': [2, 4],
    'green': [4, 2],
    'white': [4, 4]
  };

  const playerPositions: { [color: string]: Position } = {};
  for (const player of game.players) {
    playerPositions[player.color] = startingPositions[player.color];
  }

  // Initialize tokens on the board (21 tokens on interior tiles)
  const tokenPositions = initializeTokens();

  // Initialize collected tokens (empty at start)
  const collectedTokens: { [color: string]: number[] } = {};
  for (const player of game.players) {
    collectedTokens[player.color] = [];
  }

  // Set game to playing stage with board
  game.stage = 'playing';
  game.currentPlayerIndex = 0;  // First player in randomized order
  game.currentPhase = 'shift';  // Start with shift phase
  game.board = board;
  game.tileInPlay = tileInPlay;
  game.playerPositions = playerPositions;
  game.tokenPositions = tokenPositions;
  game.collectedTokens = collectedTokens;

  // Write updated game
  const gamePath = storage.getGameFilePath(code);
  await storage.writeJsonFile(gamePath, game);
}

// Update a player's color in an unstarted game
export async function updatePlayerColor(code: string, username: string, newColor: PlayerColor): Promise<void> {
  const game = await getGameByCode(code);
  if (!game) {
    throw new Error('Game not found');
  }

  // Check if game has already started
  if (game.stage !== 'unstarted') {
    throw new Error('Cannot change color after game has started');
  }

  // Find the player
  const playerIndex = game.players.findIndex(p => p.username === username);
  if (playerIndex === -1) {
    throw new Error('User is not in this game');
  }

  // Check if new color is already taken by another player
  const colorTaken = game.players.some(p => p.username !== username && p.color === newColor);
  if (colorTaken) {
    throw new Error('Color already taken');
  }

  // Update the player's color
  game.players[playerIndex].color = newColor;

  // Write updated game
  const gamePath = storage.getGameFilePath(code);
  await storage.writeJsonFile(gamePath, game);
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
