# API Endpoints

This document describes all REST API endpoints available in the Shifting Maze server.

## Base URL

All endpoints are prefixed with `/api`

- Development: `http://localhost:3001/api`

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

Authenticates a user with username and password hash.

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

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/users.ts](../../server/src/routes/users.ts)

---

## Game Endpoints

### Create Game

Creates a new game with a randomly generated 4-letter code.

**Endpoint:** `POST /api/games`

**Request Body:**
```json
{
  "name": "My Awesome Game",
  "createdBy": "john_doe"
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
  { "error": "Invalid game name. Must be 1-100 characters." }
  ```
- `500 Internal Server Error` - Server error or unable to generate unique code

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### List Games

Retrieves all games that a specific user is part of, with detailed state information including available colors for joinable games and current turn info for games in progress.

**Endpoint:** `GET /api/games?username={username}`

**Query Parameters:**
- `username` - The username to filter games by

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
- `400 Bad Request` - Missing username parameter
  ```json
  { "error": "Username query parameter required" }
  ```
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Join Game

Adds a user to an existing game. The game must be in 'unstarted' stage. If no color is specified, the first available color is automatically assigned.

**Endpoint:** `POST /api/games/:code/join`

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{
  "username": "jane_doe"
}
```

Or with optional color specification:
```json
{
  "username": "jane_doe",
  "color": "red"
}
```

**Request Fields:**
- `username` - Player's username (required)
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
- `400 Bad Request` - Missing required fields or invalid color
  ```json
  { "error": "Username required" }
  { "error": "Invalid color. Must be red, green, blue, or white" }
  ```
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

Updates a player's color choice in an unstarted game. Only valid before the game has started.

**Endpoint:** `PUT /api/games/:code/players/:username`

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")
- `username` - The username of the player changing their color

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

Starts a game by randomizing player order and setting the game to 'playing' stage. Requires 2-4 players.

**Endpoint:** `POST /api/games/:code/start`

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{}
```
(No body needed)

**Success Response (200 OK):**
```json
{
  "message": "Game started successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Game cannot be started
  ```json
  { "error": "Need at least 2 players to start the game" }
  { "error": "Game has already started or finished" }
  ```
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `500 Internal Server Error` - Server error

**Game State Changes:**
- Player order is randomized
- `stage` is set to 'playing'
- `currentPlayerIndex` is set to 0 (first player in randomized order)
- `currentPhase` is set to 'shift' (first phase of the turn)

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

## Authentication Flow

The system uses client-side password hashing for security:

1. **Registration:**
   - Client generates random 32-byte salt
   - Client hashes password: `SHA-256(password + salt)`
   - Client sends `CreateUserRequest` with hash and salt
   - Server stores both in user file

2. **Login:**
   - Client requests salt: `GET /api/users/:username/salt`
   - Client hashes password with received salt: `SHA-256(password + salt)`
   - Client sends `LoginRequest` with username and hash
   - Server compares hash with stored hash

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
