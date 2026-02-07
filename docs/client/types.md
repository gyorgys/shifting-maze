# Client Types

This document describes all TypeScript types and interfaces used in the Shifting Maze client application.

## User Types

**File:** [client/src/types/User.ts](../../client/src/types/User.ts)

### User

Represents an authenticated user in the client application.

```typescript
interface User {
  username: string;      // Unique username
  displayName: string;   // User's display name
}
```

**Usage:**
- Stored in `useAuth` hook state
- Persisted in localStorage as JSON
- Received from server after successful login or registration
- Does NOT include sensitive data (password hash, salt)

**Example:**
```typescript
const user: User = {
  username: "john_doe",
  displayName: "John Doe"
};
```

---

### CreateUserFormData

Form data for user registration.

```typescript
interface CreateUserFormData {
  username: string;      // Desired username
  displayName: string;   // Desired display name
  password: string;      // Plain text password (will be hashed client-side)
}
```

**Usage:**
- Collected from CreateUserForm component
- Passed to `createUser` API function
- Password is hashed before being sent to server

**Transformation:**
```typescript
// Form data
const formData: CreateUserFormData = {
  username: "john_doe",
  displayName: "John Doe",
  password: "mySecurePassword123"
};

// Transformed for API call
const apiData = {
  username: formData.username,
  displayName: formData.displayName,
  passwordHash: await hashPassword(formData.password, salt),
  salt: generateSalt()
};
```

---

### LoginFormData

Form data for user login.

```typescript
interface LoginFormData {
  username: string;   // Username to authenticate
  password: string;   // Plain text password (will be hashed client-side)
}
```

**Usage:**
- Collected from LoginForm component
- Passed to `login` API function
- Password is hashed with user's salt before being sent to server

**Authentication Flow:**
```typescript
const formData: LoginFormData = {
  username: "john_doe",
  password: "mySecurePassword123"
};

// Step 1: Get salt
const salt = await getUserSalt(formData.username);

// Step 2: Hash password with salt
const passwordHash = await hashPassword(formData.password, salt);

// Step 3: Send to server
const user = await loginAPI(formData.username, passwordHash);
```

---

## Game Types

**File:** [client/src/types/Game.ts](../../client/src/types/Game.ts)

### Type Aliases

Type-safe aliases to prevent mixing up similar numeric/array types:

```typescript
type PlayerColor = 'red' | 'green' | 'blue' | 'white';
type GameStage = 'unstarted' | 'playing' | 'finished';
type TurnPhase = 'shift' | 'move';
type Position = [number, number];  // [row, col]
type Tile = number;                // Bitmask 0-15
type TokenId = number;             // 0-20
```

**Why Type Aliases:**
- `Position`: Prevents mixing up coordinates with other number arrays
- `Tile`: Distinguishes tile bitmasks from other numbers
- `TokenId`: Distinguishes token IDs from other numbers
- Provides better autocomplete and error messages

---

### Game

Represents a game in the client application with complete state information.

```typescript
interface Game {
  code: string;
  name: string;
  createdBy: string;      // Username of game creator
  userCount: number;
  stage: GameStage;       // 'unstarted' | 'playing' | 'finished'
  players: Player[];
  availableColors?: PlayerColor[];  // Only for unstarted games
  currentTurn?: {
    username: string;
    color: PlayerColor;
    phase: TurnPhase;
  };

  // Board state (only present when stage is 'playing' or 'finished')
  board?: Tile[][];                           // 7x7 matrix of tiles
  tileInPlay?: Tile;                          // Tile not on board
  playerPositions?: { [color: string]: Position };
  tokenPositions?: { [tokenId: string]: Position };
  collectedTokens?: { [color: string]: TokenId[] };
}
```

**Field Availability by Stage:**

| Field | Unstarted | Playing | Finished |
|-------|-----------|---------|----------|
| `code`, `name`, `createdBy`, `userCount`, `stage`, `players` | ✓ | ✓ | ✓ |
| `availableColors` | ✓ (if not full) | ✗ | ✗ |
| `currentTurn` | ✗ | ✓ | ✗ |
| `board`, `tileInPlay`, `playerPositions`, `tokenPositions`, `collectedTokens` | ✗ | ✓ | ✓ |

**Usage:**
- Displayed in GamesList component (summary fields)
- Displayed in GamePage component (full details including board)
- Received from `listGames` API function (summary only)
- Received from `getGameDetails` API function (full details)

**Example - Unstarted Game:**
```typescript
const game: Game = {
  code: "ABCD",
  name: "Waiting Room",
  createdBy: "alice",
  userCount: 2,
  stage: "unstarted",
  players: [
    { username: "alice", color: "red" },
    { username: "bob", color: "blue" }
  ],
  availableColors: ["green", "white"]
};
```

**Example - Playing Game:**
```typescript
const game: Game = {
  code: "WXYZ",
  name: "Active Game",
  createdBy: "alice",
  userCount: 3,
  stage: "playing",
  players: [
    { username: "alice", color: "blue" },
    { username: "bob", color: "red" },
    { username: "charlie", color: "green" }
  ],
  currentTurn: {
    username: "alice",
    color: "blue",
    phase: "move"
  },
  board: [
    [10, 3, 11, 3, 11, 3, 9],
    // ... 7x7 matrix
  ],
  tileInPlay: 10,
  playerPositions: {
    "blue": [2, 2],
    "red": [2, 4],
    "green": [4, 2]
  },
  tokenPositions: {
    "0": [1, 1],
    "1": [1, 3],
    // ... all 21 tokens
  },
  collectedTokens: {
    "blue": [0, 5],
    "red": [1],
    "green": []
  }
};
```

---

### Player

Represents a player in a game.

```typescript
interface Player {
  username: string;
  color: PlayerColor;
}
```

**Usage:**
- Part of Game interface
- Displayed in player lists
- Color is used for visual indicators and board markers

---

### CreateGameFormData

Form data for creating a new game.

```typescript
interface CreateGameFormData {
  name: string;   // Desired game name
}
```

**Usage:**
- Collected from CreateGameForm component
- Passed to `createGame` API function
- Server automatically adds current user and generates code

**Example:**
```typescript
const formData: CreateGameFormData = {
  name: "Epic Adventure"
};

// API call adds username
const result = await createGame(formData, currentUsername);
// Returns: { code: "WXYZ", name: "Epic Adventure" }
```

---

### JoinGameFormData

Form data for joining a game.

```typescript
interface JoinGameFormData {
  code: string;   // 4-letter game code to join
}
```

**Usage:**
- Collected from JoinGameForm component
- Passed to `joinGame` API function
- Code must be exactly 4 uppercase letters

**Validation:**
```typescript
const formData: JoinGameFormData = {
  code: "ABCD"
};

// Validation
if (!/^[A-Z]{4}$/.test(formData.code)) {
  throw new Error('Game code must be exactly 4 letters');
}
```

---

## Type Usage in API Service

**File:** [client/src/services/api.ts](../../client/src/services/api.ts)

### Function Signatures

```typescript
// User API
function createUser(formData: CreateUserFormData): Promise<User>
function getUserSalt(username: string): Promise<string | null>
function login(formData: LoginFormData): Promise<User | null>

// Game API
function createGame(
  formData: CreateGameFormData,
  token: string
): Promise<{ code: string; name: string }>

function listGames(token: string): Promise<Game[]>

function getGame(gameCode: string, token: string): Promise<Game>

function getGameDetails(gameCode: string, token: string): Promise<Game>

function joinGame(formData: JoinGameFormData, token: string): Promise<void>

function updatePlayerColor(
  gameCode: string,
  token: string,
  color: PlayerColor
): Promise<void>

function startGame(gameCode: string, token: string): Promise<void>
```

**Notes:**
- All game endpoints require JWT `token` for authentication
- `getGame()` returns summary data (uses listGames internally)
- `getGameDetails()` returns full game state including board (direct API call)

---

## Type Usage in Hooks

**File:** [client/src/hooks/useAuth.ts](../../client/src/hooks/useAuth.ts)

### useAuth Hook

```typescript
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (userData: User) => void;
  const logout = () => void;

  return { user, loading, login, logout };
}
```

**Return Type:**
```typescript
{
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}
```

---

## localStorage Schema

### User Storage

**Key:** `"user"`

**Value:**
```json
{
  "username": "john_doe",
  "displayName": "John Doe"
}
```

**Type:** Serialized `User` interface

**Operations:**
```typescript
// Save
localStorage.setItem('user', JSON.stringify(user));

// Load
const storedUser = localStorage.getItem('user');
const user: User = JSON.parse(storedUser);

// Clear
localStorage.removeItem('user');
```

---

## Type Safety

All types are strictly enforced with TypeScript's strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

This ensures:
- No implicit `any` types
- Null/undefined checks enforced
- Type errors caught at compile time
- Autocomplete and IntelliSense support
