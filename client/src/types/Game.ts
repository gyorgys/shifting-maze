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

// Client-specific Game interface
export interface Game {
  code: string;
  name: string;
  createdBy: string;  // Username of the game creator
  userCount: number;
  stage: GameStage;
  players: Player[];
  availableColors?: PlayerColor[];
  currentTurn?: CurrentTurn;

  // Board state (only present when stage is 'playing' or 'finished')
  board?: Tile[][];  // 7x7 matrix of tiles
  tileInPlay?: Tile;
  playerPositions?: { [color: string]: Position };
  tokenPositions?: { [tokenId: string]: Position };
  collectedTokens?: { [color: string]: TokenId[] };
}

// Client-specific form data types
export interface CreateGameFormData {
  name: string;
}

export interface JoinGameFormData {
  code: string;
  // No color field - server auto-assigns first available color
}
