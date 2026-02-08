// Import shared types
import type {
  PlayerColor,
  GameStage,
  TurnPhase,
  Position,
  Tile,
  TokenId,
  Player,
  CurrentTurn,
} from '@shared/types';

// Re-export shared types for convenience
export type {
  PlayerColor,
  GameStage,
  TurnPhase,
  Position,
  Tile,
  TokenId,
  Player,
  CurrentTurn,
};

// Server-specific Game interface (stored in database)
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
  board?: Tile[][];  // 7x7 matrix of tiles
  tileInPlay?: Tile; // The extra tile not currently on the board
  playerPositions?: { [color: string]: Position }; // Map of player color to board position
  tokenPositions?: { [tokenId: string]: Position }; // Map of token ID to board position (for tokens on board)
  collectedTokens?: { [color: string]: TokenId[] }; // Map of player color to collected token IDs
}

// API Request/Response types
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
    currentTurn?: CurrentTurn;
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
