import { User, CreateUserFormData, LoginFormData } from '../types/User';
import { Game, CreateGameFormData, JoinGameFormData, PlayerColor } from '../types/Game';

type JsonRequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

async function jsonRequest<T>(url: string, options: JsonRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

// Utility: Hash password with salt using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate random salt
function generateSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Users API
export async function createUser(formData: CreateUserFormData): Promise<{ username: string; displayName: string }> {
  try {
    const salt = generateSalt();
    const passwordHash = await hashPassword(formData.password, salt);

    const userData = await jsonRequest<{ username: string; displayName: string }>('/api/users', {
      method: 'POST',
      body: {
        username: formData.username,
        displayName: formData.displayName,
        passwordHash,
        salt,
      },
    });
    return {
      username: userData.username,
      displayName: userData.displayName,
    };
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

export async function getUserSalt(username: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/users/${username}/salt`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.salt;
  } catch (error) {
    console.error('Get salt error:', error);
    throw error;
  }
}

export async function login(formData: LoginFormData): Promise<User | null> {
  try {
    // Get salt first
    const salt = await getUserSalt(formData.username);
    if (!salt) {
      return null;
    }

    // Hash password with salt
    const passwordHash = await hashPassword(formData.password, salt);

    // Send login request
    const data = await jsonRequest<{
      success: boolean;
      user: { username: string; displayName: string };
      token: string;
    }>('/api/users/login', {
      method: 'POST',
      body: {
        username: formData.username,
        passwordHash,
      },
    });
    if (data.success) {
      return {
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token,
      };
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Games API
export async function createGame(
  formData: CreateGameFormData,
  token: string
): Promise<{ code: string; name: string }> {
  try {
    return await jsonRequest<{ code: string; name: string }>('/api/games', {
      method: 'POST',
      token,
      body: {
        name: formData.name,
      },
    });
  } catch (error) {
    console.error('Create game error:', error);
    throw error;
  }
}

export async function listGames(token: string): Promise<Game[]> {
  try {
    const data = await jsonRequest<{ games: Game[] }>('/api/games', { token });
    return data.games;
  } catch (error) {
    console.error('List games error:', error);
    throw error;
  }
}

export async function joinGame(formData: JoinGameFormData, token: string): Promise<void> {
  try {
    await jsonRequest<void>(`/api/games/${formData.code}/join`, {
      method: 'POST',
      token,
      body: {},
    });
  } catch (error) {
    console.error('Join game error:', error);
    throw error;
  }
}

export async function updatePlayerColor(
  gameCode: string,
  token: string,
  color: PlayerColor
): Promise<void> {
  try {
    await jsonRequest<void>(`/api/games/${gameCode}/players/color`, {
      method: 'PUT',
      token,
      body: { color },
    });
  } catch (error) {
    console.error('Update player color error:', error);
    throw error;
  }
}

export async function getGame(gameCode: string, token: string): Promise<Game> {
  try {
    // Re-use listGames and find the specific game
    const games = await listGames(token);
    const game = games.find(g => g.code === gameCode);
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  } catch (error) {
    console.error('Get game error:', error);
    throw error;
  }
}

export async function getGameDetails(gameCode: string, token: string): Promise<Game> {
  try {
    return await jsonRequest<Game>(`/api/games/${gameCode}`, { token });
  } catch (error) {
    console.error('Get game details error:', error);
    throw error;
  }
}

export interface ShiftRequest {
  tile: number;
  shiftType: 'row' | 'column';
  shiftIndex: number;
  direction: string;
}

export async function performShift(
  gameCode: string,
  token: string,
  shift: ShiftRequest
): Promise<Game> {
  try {
    return await jsonRequest<Game>(`/api/games/${gameCode}/shift`, {
      method: 'POST',
      token,
      body: shift,
    });
  } catch (error) {
    console.error('Perform shift error:', error);
    throw error;
  }
}

export async function startGame(gameCode: string, token: string): Promise<void> {
  try {
    await jsonRequest<void>(`/api/games/${gameCode}/start`, {
      method: 'POST',
      token,
      body: {},
    });
  } catch (error) {
    console.error('Start game error:', error);
    throw error;
  }
}
