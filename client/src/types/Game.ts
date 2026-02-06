export type PlayerColor = 'red' | 'green' | 'blue' | 'white';
export type GameStage = 'unstarted' | 'playing' | 'finished';
export type TurnPhase = 'shift' | 'move';

export interface Player {
  username: string;
  color: PlayerColor;
}

export interface Game {
  code: string;
  name: string;
  userCount: number;
  stage: GameStage;
  players: Player[];
  availableColors?: PlayerColor[];
  currentTurn?: {
    username: string;
    color: PlayerColor;
    phase: TurnPhase;
  };
}

export interface CreateGameFormData {
  name: string;
}

export interface JoinGameFormData {
  code: string;
  // No color field - server auto-assigns first available color
}
