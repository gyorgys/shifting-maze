# Server Models

This document describes the data models used in the Shifting Maze server.

## User Model

**File:** [server/src/models/User.ts](../../server/src/models/User.ts)

### User Interface

Represents a registered user in the system.

```typescript
interface User {
  username: string;        // Unique identifier, alphanumeric + underscore
  displayName: string;     // User's display name (1-50 chars)
  passwordHash: string;    // SHA-256 hash of password + salt
  salt: string;            // Random 32-byte salt for password hashing
  createdAt: string;       // ISO 8601 timestamp of account creation
}
```

**Validation Rules:**
- `username`: 3-20 characters, alphanumeric and underscores only, no spaces
- `displayName`: 1-50 characters, spaces allowed
- `passwordHash`: SHA-256 hash generated client-side
- `salt`: 32-byte random value generated during registration

**Storage:**
- Location: `server/data/users/{username}.json`
- Format: JSON file per user

### CreateUserRequest

Request body for creating a new user.

```typescript
interface CreateUserRequest {
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
}
```

### GetSaltResponse

Response for retrieving a user's salt.

```typescript
interface GetSaltResponse {
  salt: string;
}
```

### LoginRequest

Request body for user authentication.

```typescript
interface LoginRequest {
  username: string;
  passwordHash: string;
}
```

### LoginResponse

Response for login authentication.

```typescript
interface LoginResponse {
  success: boolean;
  user?: {
    username: string;
    displayName: string;
  };
  message?: string;
}
```

## Game Model

**File:** [server/src/models/Game.ts](../../server/src/models/Game.ts)

### Game Interface

Represents a game instance.

```typescript
interface Game {
  code: string;            // Unique 4-letter uppercase code (e.g., "ABCD")
  name: string;            // Game name (1-100 chars)
  users: string[];         // Array of usernames of players in the game
  createdAt: string;       // ISO 8601 timestamp of game creation
  createdBy: string;       // Username of the game creator
}
```

**Validation Rules:**
- `code`: Exactly 4 uppercase letters (A-Z), randomly generated
- `name`: 1-100 characters
- `users`: Array starts with creator, additional users join via join endpoint
- `createdBy`: Must be a valid username

**Code Generation:**
- Format: 4 random uppercase letters
- Total possibilities: 26^4 = 456,976 combinations
- Collision detection: Retries up to 100 times if code exists
- Uniqueness: Validated against existing game files

**Storage:**
- Location: `server/data/games/{code}.json`
- Format: JSON file per game

### CreateGameRequest

Request body for creating a new game.

```typescript
interface CreateGameRequest {
  name: string;
  createdBy: string;       // Username of creator
}
```

### CreateGameResponse

Response for successful game creation.

```typescript
interface CreateGameResponse {
  code: string;            // The generated game code
  name: string;            // The game name
}
```

### ListGamesResponse

Response for listing games.

```typescript
interface ListGamesResponse {
  games: Array<{
    code: string;
    name: string;
    userCount: number;     // Number of players in the game
  }>;
}
```

### JoinGameRequest

Request body for joining a game.

```typescript
interface JoinGameRequest {
  username: string;
}
```

## Relationships

- A **User** can be in multiple **Games**
- A **Game** contains multiple **Users** (referenced by username)
- The creator of a **Game** is automatically added to the users array
- Users can join additional games using the game code
