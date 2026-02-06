export interface Game {
  code: string;
  name: string;
  userCount: number;
}

export interface CreateGameFormData {
  name: string;
}

export interface JoinGameFormData {
  code: string;
}
