export type PlayerColor = 'red' | 'green' | 'blue' | 'white';
export type GameStage = 'unstarted' | 'playing' | 'finished';
export type TurnPhase = 'shift' | 'move';
export type Position = [number, number];
export type Tile = number;
export type TokenId = number;

export interface Player {
  username: string;
  color: PlayerColor;
}

export interface Game {
  code: string;
  name: string;
  createdBy: string;  // Username of the game creator
  userCount: number;
  stage: GameStage;
  players: Player[];
  availableColors?: PlayerColor[];
  currentTurn?: {
    username: string;
    color: PlayerColor;
    phase: TurnPhase;
  };

  // Board state (only present when stage is 'playing' or 'finished')
  board?: Tile[][];  // 7x7 matrix of tiles
  tileInPlay?: Tile;
  playerPositions?: { [color: string]: Position };
  tokenPositions?: { [tokenId: string]: Position };
  collectedTokens?: { [color: string]: TokenId[] };
}

export interface CreateGameFormData {
  name: string;
}

export interface JoinGameFormData {
  code: string;
  // No color field - server auto-assigns first available color
}
