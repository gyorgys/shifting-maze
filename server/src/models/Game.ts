export interface Game {
  code: string;
  name: string;
  users: string[];
  createdAt: string;
  createdBy: string;
}

export interface CreateGameRequest {
  name: string;
  createdBy: string;
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
  }>;
}

export interface JoinGameRequest {
  username: string;
}
