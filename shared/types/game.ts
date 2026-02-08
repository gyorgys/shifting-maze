/**
 * Shared game-related type definitions
 * Used by both client and server
 */

// Player colors available in the game
export type PlayerColor = 'red' | 'green' | 'blue' | 'white';

// Game stages
export type GameStage = 'unstarted' | 'playing' | 'finished';

// Turn phases - each turn has two phases
export type TurnPhase = 'shift' | 'move';

// Board position coordinates [row, col]
export type Position = [number, number];

// Tile representation (0-15, 4-bit bitmask for L/R/T/B sides)
export type Tile = number;

// Token identifier (0-20)
export type TokenId = number;

// Player in a game
export interface Player {
  username: string;
  color: PlayerColor;
}

// Current turn information
export interface CurrentTurn {
  username: string;
  color: PlayerColor;
  phase: TurnPhase;
}
