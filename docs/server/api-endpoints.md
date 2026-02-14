# API Endpoints

This document describes all REST API endpoints available in the Shifting Maze server.

## Base URL

All endpoints are prefixed with `/api`

- Development: `http://localhost:3001/api`

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

**How to authenticate:**
1. Login via `POST /api/users/login` to receive a JWT token
2. Include the token in the `Authorization` header for protected endpoints:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

**Protected endpoints** (require authentication):
- All game endpoints except public user endpoints

**Token expiration:** 24 hours

**Error responses for protected endpoints:**
- `401 Unauthorized` - No token provided
  ```json
  { "error": "Authentication required" }
  ```
- `403 Forbidden` - Invalid or expired token
  ```json
  { "error": "Invalid or expired token" }
  ```

## User Endpoints

### Create User

Creates a new user account.

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "john_doe",
  "displayName": "John Doe",
  "passwordHash": "abc123...",
  "salt": "def456..."
}
```

**Success Response (201 Created):**
```json
{
  "username": "john_doe",
  "displayName": "John Doe",
  "createdAt": "2026-02-06T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid format
  ```json
  { "error": "Invalid username format. Must be 3-20 alphanumeric characters or underscores." }
  ```
- `409 Conflict` - Username already exists
  ```json
  { "error": "Username already exists" }
  ```
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/users.ts](../../server/src/routes/users.ts)

---

### Get User Salt

Retrieves the salt for a specific user (needed for client-side password hashing).

**Endpoint:** `GET /api/users/:username/salt`

**URL Parameters:**
- `username` - The username to get salt for

**Success Response (200 OK):**
```json
{
  "salt": "def456..."
}
```

**Error Responses:**
- `404 Not Found` - User doesn't exist
  ```json
  { "error": "User not found" }
  ```
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/users.ts](../../server/src/routes/users.ts)

---

### Login

Authenticates a user with username and password hash. Returns a JWT token for accessing protected endpoints.

**Endpoint:** `POST /api/users/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "passwordHash": "abc123..."
}
```

**Success Response (200 OK):**

When credentials are valid:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "john_doe",
    "displayName": "John Doe"
  }
}
```

When credentials are invalid:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Token Usage:**
Use the returned token in the `Authorization` header for all protected endpoints:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/users.ts](../../server/src/routes/users.ts)

---

## Game Endpoints

### Create Game

Creates a new game with a randomly generated 4-letter code. The authenticated user becomes the creator and is automatically added as the first player.

**Endpoint:** `POST /api/games`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "name": "My Awesome Game"
}
```

**Success Response (201 Created):**
```json
{
  "code": "ABCD",
  "name": "My Awesome Game"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid game name
  ```json
  { "error": "Game name required" }
  { "error": "Invalid game name. Must be 1-100 characters." }
  ```
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - Invalid or expired token
- `500 Internal Server Error` - Server error or unable to generate unique code

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### List Games

Retrieves all games that the authenticated user is part of, with detailed state information including available colors for joinable games and current turn info for games in progress.

**Endpoint:** `GET /api/games`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200 OK):**

The response includes different fields based on the game's stage:

**Example - Unstarted game (waiting for players):**
```json
{
  "games": [
    {
      "code": "ABCD",
      "name": "Waiting Room",
      "userCount": 2,
      "stage": "unstarted",
      "players": [
        { "username": "john_doe", "color": "red" },
        { "username": "jane_smith", "color": "blue" }
      ],
      "availableColors": ["green", "white"]
    }
  ]
}
```

**Example - Playing game (in progress):**
```json
{
  "games": [
    {
      "code": "WXYZ",
      "name": "Active Game",
      "userCount": 3,
      "stage": "playing",
      "players": [
        { "username": "alice", "color": "blue" },
        { "username": "bob", "color": "red" },
        { "username": "charlie", "color": "green" }
      ],
      "currentTurn": {
        "username": "alice",
        "color": "blue",
        "phase": "move"
      }
    }
  ]
}
```

**Example - Finished game:**
```json
{
  "games": [
    {
      "code": "DONE",
      "name": "Completed Game",
      "userCount": 4,
      "stage": "finished",
      "players": [
        { "username": "alice", "color": "blue" },
        { "username": "bob", "color": "red" },
        { "username": "charlie", "color": "green" },
        { "username": "diana", "color": "white" }
      ]
    }
  ]
}
```

**Response Fields:**
- `code` - Game code
- `name` - Game name
- `userCount` - Number of players in the game
- `stage` - Game stage: "unstarted", "playing", or "finished"
- `players` - Array of players in the game with their usernames and colors
- `availableColors` - (Only for unstarted games with space) Array of colors that can still be chosen
- `currentTurn` - (Only for playing games) Object with:
  - `username` - Whose turn it is
  - `color` - That player's color
  - `phase` - Current turn phase ("shift" or "move")

**Error Responses:**
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - Invalid or expired token
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Get Game Details

Retrieves full details for a single game, including board state for playing/finished games. Only accessible to players who are part of the game.

**Endpoint:** `GET /api/games/:code`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Success Response (200 OK):**

**Example - Playing game with full board state:**
```json
{
  "code": "WXYZ",
  "name": "Active Game",
  "createdBy": "alice",
  "userCount": 3,
  "stage": "playing",
  "players": [
    { "username": "alice", "color": "blue" },
    { "username": "bob", "color": "red" },
    { "username": "charlie", "color": "green" }
  ],
  "currentTurn": {
    "username": "alice",
    "color": "blue",
    "phase": "move"
  },
  "board": [
    [10, 3, 11, 3, 11, 3, 9],
    // ... 7x7 matrix of tile bitmasks
  ],
  "tileInPlay": 10,
  "playerPositions": {
    "blue": [2, 2],
    "red": [2, 4],
    "green": [4, 2]
  },
  "tokenPositions": {
    "0": [1, 1],
    "1": [1, 3],
    // ... all 21 tokens
  },
  "collectedTokens": {
    "blue": [0, 5],
    "red": [1],
    "green": []
  }
}
```

**Response Fields:**
- `code` - Game code
- `name` - Game name
- `createdBy` - Username of game creator
- `userCount` - Number of players in the game
- `stage` - Game stage: "unstarted", "playing", or "finished"
- `players` - Array of players with usernames and colors
- `availableColors` - (unstarted games only) Array of colors that can be chosen
- `currentTurn` - (playing games only) Object with:
  - `username` - Current player's username
  - `color` - Current player's color
  - `phase` - Current turn phase ("shift" or "move")
- `board` - (playing/finished games only) 7x7 matrix of tile bitmasks (0-15)
- `tileInPlay` - (playing/finished games only) The tile not currently on the board
- `playerPositions` - (playing/finished games only) Map of color to [row, col] position
- `tokenPositions` - (playing/finished games only) Map of token ID (0-20) to [row, col]
- `collectedTokens` - (playing/finished games only) Map of color to array of collected token IDs

**Error Responses:**
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - User is not a player in this game
  ```json
  { "error": "Not authorized to view this game" }
  ```
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `500 Internal Server Error` - Server error

**Use Case:**
This endpoint provides complete game state for rendering the game board. The board state fields (`board`, `tileInPlay`, etc.) are only present when the game is in 'playing' or 'finished' stage.

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Join Game

Adds the authenticated user to an existing game. The game must be in 'unstarted' stage. If no color is specified, the first available color is automatically assigned.

**Endpoint:** `POST /api/games/:code/join`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{}
```

Or with optional color specification:
```json
{
  "color": "red"
}
```

**Request Fields:**
- `color` - Player's chosen color (optional). If not provided, first available color is auto-assigned

**Success Response (200 OK):**
```json
{
  "message": "Successfully joined game"
}
```

**Auto-Assignment Behavior:**
- When color is not provided, server assigns colors in this order: red → green → blue → white
- Players can change their assigned color later using the Update Player Color endpoint

**Error Responses:**
- `400 Bad Request` - Invalid color
  ```json
  { "error": "Invalid color. Must be red, green, blue, or white" }
  ```
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - Invalid or expired token
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `409 Conflict` - Various conflict scenarios
  ```json
  { "error": "User already in game" }
  { "error": "Color already taken" }
  { "error": "Game is full" }
  { "error": "Cannot join game that has already started" }
  ```
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Update Player Color

Updates the authenticated player's color choice in an unstarted game. Only valid before the game has started.

**Endpoint:** `PUT /api/games/:code/players/color`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{
  "color": "green"
}
```

**Request Fields:**
- `color` - New color to switch to (must be one of: "red", "green", "blue", "white")

**Success Response (200 OK):**
```json
{
  "message": "Color updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid color
  ```json
  { "error": "Color required" }
  { "error": "Invalid color. Must be red, green, blue, or white" }
  ```
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - Invalid or expired token
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `409 Conflict` - Various conflict scenarios
  ```json
  { "error": "User is not in this game" }
  { "error": "Color already taken" }
  { "error": "Cannot change color after game has started" }
  ```
- `500 Internal Server Error` - Server error

**Use Case:**
Allows players to change their mind about their color choice while waiting for the game to start. Once the game begins, colors are locked in.

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Start Game

Starts a game by randomizing player order and setting the game to 'playing' stage. Only the game creator can start the game, and it requires 2-4 players.

**Endpoint:** `POST /api/games/:code/start`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{}
```
(No body needed - authenticated user must be the game creator)

**Success Response (200 OK):**
```json
{
  "message": "Game started successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Game cannot be started
  ```json
  { "error": "Only the game creator can start the game" }
  { "error": "Need at least 2 players to start the game" }
  { "error": "Game has already started or finished" }
  ```
- `401 Unauthorized` - No authentication token provided
- `403 Forbidden` - Invalid or expired token
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `500 Internal Server Error` - Server error

**Validation:**
- Authenticated user must be the game creator (matching `createdBy` field)
- Game must be in 'unstarted' stage
- Game must have at least 2 players

**Game State Changes:**
- Player order is randomized
- `stage` is set to 'playing'
- `currentPlayerIndex` is set to 0 (first player in randomized order)
- `currentPhase` is set to 'shift' (first phase of the turn)

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Perform Shift

Performs a shift action during the shift phase of the current player's turn. Inserts the tile in play into the board by pushing a row or column.

**Endpoint:** `POST /api/games/:code/shift`

**Authentication:** Required

**Request Body:**
```json
{
  "tile": 10,
  "shiftType": "row",
  "shiftIndex": 3,
  "direction": "right"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tile` | `number` | The rotated tile to insert (0-15 bitmask) |
| `shiftType` | `string` | `"row"` or `"column"` |
| `shiftIndex` | `number` | Which row/column to shift (1, 3, or 5) |
| `direction` | `string` | `"left"` / `"right"` for rows, `"up"` / `"down"` for columns |

**Success Response (200):**

Returns the full game state (same format as Get Game Details), with:
- `currentPhase` advanced to `"move"`
- `board` updated with shifted tiles
- `tileInPlay` set to the tile that was pushed off the board
- `playerPositions` and `tokenPositions` updated (entities in the shifted row/column move with their tiles; entities pushed off wrap to the opposite side)

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Invalid tile value, shift type, shift index, or direction |
| 403 | Not the current player's turn, or not in shift phase |
| 404 | Game not found |
| 500 | Internal server error |

**Validation:**
- Authenticated user must be a player in the game
- It must be the user's turn (`currentPlayerIndex` matches)
- Game must be in `shift` phase
- `shiftIndex` must be 1, 3, or 5 (odd indices only; even indices have fixed tiles)
- `tile` must be 0-15

**Game State Changes:**
- Board row/column is shifted, inserting the provided tile
- The tile pushed off becomes the new `tileInPlay`
- Player and token positions in the shifted row/column are updated
- `currentPhase` changes from `"shift"` to `"move"`

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts), [server/src/utils/shiftUtils.ts](../../server/src/utils/shiftUtils.ts)

---

## Authentication Flow

The system uses client-side password hashing and JWT tokens for security:

1. **Registration:**
   - Client generates random 32-byte salt
   - Client hashes password: `SHA-256(password + salt)`
   - Client sends `CreateUserRequest` with hash and salt
   - Server stores both in user file

2. **Login:**
   - Client requests salt: `GET /api/users/:username/salt`
   - Client hashes password with received salt: `SHA-256(password + salt)`
   - Client sends `LoginRequest` with username and hash
   - Server validates credentials and returns JWT token
   - Client stores token for subsequent requests

3. **Accessing Protected Endpoints:**
   - Client includes JWT token in Authorization header: `Bearer <token>`
   - Server validates token and extracts user information
   - Server processes request with authenticated user context

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)

**Configuration:** [server/src/index.ts](../../server/src/index.ts)
