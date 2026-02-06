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

### Game

Represents a game in the client application.

```typescript
interface Game {
  code: string;        // 4-letter game code (e.g., "ABCD")
  name: string;        // Game name
  userCount: number;   // Number of players in the game
}
```

**Usage:**
- Displayed in GamesList component
- Received from `listGames` API function
- Simplified version of server's Game model (doesn't include full user list)

**Example:**
```typescript
const game: Game = {
  code: "ABCD",
  name: "My Awesome Game",
  userCount: 3
};
```

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
  username: string
): Promise<{ code: string; name: string }>

function listGames(username: string): Promise<Game[]>

function joinGame(
  formData: JoinGameFormData,
  username: string
): Promise<void>
```

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
