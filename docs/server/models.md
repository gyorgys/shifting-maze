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

Response for login authentication. Includes JWT token when successful.

```typescript
interface LoginResponse {
  success: boolean;
  token?: string;        // JWT token for authentication (present when success is true)
  user?: {
    username: string;
    displayName: string;
  };
  message?: string;      // Error message (present when success is false)
}
```

**Token Usage:**
- When `success` is `true`, the `token` field contains a JWT token
- This token should be included in the `Authorization` header for all protected endpoints:
  ```
  Authorization: Bearer <token>
  ```
- Token expires after 24 hours

## Game Model

**File:** [server/src/models/Game.ts](../../server/src/models/Game.ts)

### Type Definitions

```typescript
type PlayerColor = 'red' | 'green' | 'blue' | 'white';
type GameStage = 'unstarted' | 'playing' | 'finished';
type TurnPhase = 'shift' | 'move';
```

### Player Interface

Represents a player in a game with their chosen color.

```typescript
interface Player {
  username: string;        // Player's username
  color: PlayerColor;      // Player's chosen color
}
```

### Game Interface

Represents a game instance with full state tracking.

```typescript
interface Game {
  code: string;            // Unique 4-letter uppercase code (e.g., "ABCD")
  name: string;            // Game name (1-100 chars)
  createdAt: string;       // ISO 8601 timestamp of game creation
  createdBy: string;       // Username of the game creator

  // Game stage tracking
  stage: GameStage;        // 'unstarted' | 'playing' | 'finished'

  // Player tracking (2-4 players required to play)
  players: Player[];       // Players with their chosen colors
  maxPlayers: number;      // Always 4

  // Turn tracking (only used when stage is 'playing')
  currentPlayerIndex?: number;   // Index into players array
  currentPhase?: TurnPhase;      // 'shift' | 'move'
}
```

**Game Stages:**
- `unstarted`: Waiting for players to join (2-4 players needed)
- `playing`: Game is in progress
- `finished`: Game has ended

**Turn Phases:**
Each player's turn consists of two phases:
1. `shift`: Player shifts a row or column on the board
2. `move`: Player moves their piece on the board

**Player Colors:**
- Four colors available: `red`, `green`, `blue`, `white`
- Each color can only be chosen by one player per game
- Players must choose a color when joining

**Validation Rules:**
- `code`: Exactly 4 uppercase letters (A-Z), randomly generated
- `name`: 1-100 characters
- `players`: 2-4 players required to start the game
- `maxPlayers`: Always 4
- `currentPlayerIndex`: Set when game starts, randomized player order
- `currentPhase`: Starts with 'shift' when game begins

**Game Flow:**
1. Game created in `unstarted` stage with no players
2. Players join (2-4) and choose unique colors
3. Game starts: player order randomized, stage becomes `playing`
4. Players take turns (shift phase → move phase)
5. Game ends and stage becomes `finished`

**Code Generation:**
- Format: 4 random uppercase letters
- Total possibilities: 26^4 = 456,976 combinations
- Collision detection: Retries up to 100 times if code exists
- Uniqueness: Validated against existing game files

**Storage:**
- Location: `server/data/games/{code}.json`
- Format: JSON file per game

### CreateGameRequest

Request body for creating a new game. The creator's username comes from the authenticated user.

```typescript
interface CreateGameRequest {
  name: string;
  // createdBy comes from authenticated user via JWT token
}
```

**Authentication:**
- Requires valid JWT token in Authorization header
- The authenticated user becomes the game creator
- Creator is automatically added as the first player with color 'red'

### CreateGameResponse

Response for successful game creation.

```typescript
interface CreateGameResponse {
  code: string;            // The generated game code
  name: string;            // The game name
}
```

### ListGamesResponse

Response for listing games with detailed state information.

```typescript
interface ListGamesResponse {
  games: Array<{
    code: string;
    name: string;
    userCount: number;
    stage: GameStage;      // 'unstarted' | 'playing' | 'finished'
    players: Player[];     // Always present - list of players with their colors

    // Available colors if game can be joined (stage is 'unstarted' and not full)
    availableColors?: PlayerColor[];

    // Current turn info if game is in progress (stage is 'playing')
    currentTurn?: {
      username: string;
      color: PlayerColor;
      phase: TurnPhase;    // 'shift' | 'move'
    };
  }>;
}
```

**Always Present Fields:**
- `players`: Array of all players in the game with their usernames and chosen colors. Present for all game stages.

**Conditional Fields:**
- `availableColors`: Only present when `stage` is 'unstarted' and game is not full (less than 4 players). Lists the colors that can still be chosen by new players.
- `currentTurn`: Only present when `stage` is 'playing'. Shows whose turn it is, their color, and the current phase.

### JoinGameRequest

Request body for joining a game. The player's username comes from the authenticated user. Color is optional - if not provided, the first available color is automatically assigned.

```typescript
interface JoinGameRequest {
  // username comes from authenticated user via JWT token
  color?: PlayerColor;     // Optional color ('red' | 'green' | 'blue' | 'white')
                           // If not provided, first available color is auto-assigned
}
```

**Authentication:**
- Requires valid JWT token in Authorization header
- The authenticated user is added to the game

**Validation:**
- If color is provided:
  - Must be one of: 'red', 'green', 'blue', 'white'
  - Must not already be taken by another player
- Game must be in 'unstarted' stage
- Game must not be full (max 4 players)
- User must not already be in the game

**Auto-assignment:**
- If no color is provided, the server assigns the first available color
- Colors are assigned in order: red, green, blue, white
- Players can change their color later using the PUT endpoint

### StartGameRequest

Request to start a game. The requester's username comes from the authenticated user. Only the game creator can start the game.

```typescript
interface StartGameRequest {
  // username comes from authenticated user via JWT token
}
```

**Authentication:**
- Requires valid JWT token in Authorization header
- Authenticated user must be the game creator

**Requirements:**
- Requester must be the game creator (authenticated username must match `createdBy`)
- Game must have 2-4 players
- Game must be in 'unstarted' stage
- Player order will be randomized when game starts

### UpdatePlayerColorRequest

Request body for updating the authenticated player's color in an unstarted game.

```typescript
interface UpdatePlayerColorRequest {
  color: PlayerColor;  // New color to switch to
}
```

**Authentication:**
- Requires valid JWT token in Authorization header
- Authenticated user must be in the game

**Validation:**
- Color must be one of: 'red', 'green', 'blue', 'white'
- Color must not be taken by another player
- Game must be in 'unstarted' stage
- Authenticated user must already be in the game

## Relationships

- A **User** can be in multiple **Games**
- A **Game** contains multiple **Players** (2-4 players)
- Each **Player** has a unique **PlayerColor** within a game
- The creator of a **Game** must join as a player by choosing a color
- Games track whose turn it is via `currentPlayerIndex` and `currentPhase`
