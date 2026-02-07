// Player colors available in the game
export type PlayerColor = 'red' | 'green' | 'blue' | 'white';

// Game stages
export type GameStage = 'unstarted' | 'playing' | 'finished';

// Turn phases - each turn has two phases
export type TurnPhase = 'shift' | 'move';

// Player in a game
export interface Player {
  username: string;
  color: PlayerColor;
}

export interface Game {
  code: string;
  name: string;
  createdAt: string;
  createdBy: string;

  // Game stage tracking
  stage: GameStage;  // 'unstarted' when waiting for players, 'playing' during game, 'finished' when complete

  // Player tracking (2-4 players required to play)
  players: Player[];  // Players with their chosen colors, order is randomized at game start
  maxPlayers: number; // Always 4

  // Turn tracking (only used when stage is 'playing')
  currentPlayerIndex?: number;  // Index into players array indicating whose turn it is
  currentPhase?: TurnPhase;     // Current phase: 'shift' or 'move'

  // Board state (only present when stage is 'playing')
  board?: number[][];  // 7x7 matrix of tiles (each tile is 0-15 bitmask)
  tileInPlay?: number; // The extra tile not currently on the board
  playerPositions?: { [color: string]: [number, number] }; // Map of player color to [row, col] position
  tokenPositions?: { [tokenId: string]: [number, number] }; // Map of token ID to [row, col] position (for tokens on board)
  collectedTokens?: { [color: string]: number[] }; // Map of player color to collected token IDs
}

export interface CreateGameRequest {
  name: string;
  // createdBy comes from authenticated user
}

export interface CreateGameResponse {
  code: string;
  name: string;
}

export interface ListGamesResponse {
  games: Array<{
    code: string;
    name: string;
    userCount: number;
    stage: GameStage;
    players: Player[];  // Always present - list of players with their colors

    // Available colors if game can be joined (stage is 'unstarted' and not full)
    availableColors?: PlayerColor[];

    // Current turn info if game is in progress (stage is 'playing')
    currentTurn?: {
      username: string;
      color: PlayerColor;
      phase: TurnPhase;
    };
  }>;
}

export interface JoinGameRequest {
  // username comes from authenticated user
  color?: PlayerColor;  // Optional - if not provided, first available color is auto-assigned
}

export interface StartGameRequest {
  // username comes from authenticated user
}

export interface UpdatePlayerColorRequest {
  color: PlayerColor;  // New color the player wants to switch to
}
