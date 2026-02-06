import { User, CreateUserFormData, LoginFormData } from '../types/User';
import { Game, CreateGameFormData, JoinGameFormData, PlayerColor } from '../types/Game';

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

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username,
        displayName: formData.displayName,
        passwordHash,
        salt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const userData = await response.json();
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
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username,
        passwordHash,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
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
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: formData.name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Create game error:', error);
    throw error;
  }
}

export async function listGames(token: string): Promise<Game[]> {
  try {
    const response = await fetch('/api/games', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('List games error:', error);
    throw error;
  }
}

export async function joinGame(formData: JoinGameFormData, token: string): Promise<void> {
  try {
    const response = await fetch(`/api/games/${formData.code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        // No fields needed - username comes from JWT
        // No color - server will auto-assign first available
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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
    const response = await fetch(`/api/games/${gameCode}/players/color`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
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

export async function startGame(gameCode: string, token: string): Promise<void> {
  try {
    const response = await fetch(`/api/games/${gameCode}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Start game error:', error);
    throw error;
  }
}
