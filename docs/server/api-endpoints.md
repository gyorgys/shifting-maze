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

Retrieves all games that a specific user is part of.

**Endpoint:** `GET /api/games?username={username}`

**Query Parameters:**
- `username` - The username to filter games by

**Success Response (200 OK):**
```json
{
  "games": [
    {
      "code": "ABCD",
      "name": "My Awesome Game",
      "userCount": 3
    },
    {
      "code": "WXYZ",
      "name": "Another Game",
      "userCount": 1
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing username parameter
  ```json
  { "error": "Username query parameter required" }
  ```
- `500 Internal Server Error` - Server error

**Implementation:** [server/src/routes/games.ts](../../server/src/routes/games.ts)

---

### Join Game

Adds a user to an existing game by game code.

**Endpoint:** `POST /api/games/:code/join`

**URL Parameters:**
- `code` - The 4-letter game code (e.g., "ABCD")

**Request Body:**
```json
{
  "username": "jane_doe"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Successfully joined game"
}
```

**Error Responses:**
- `400 Bad Request` - Missing username
  ```json
  { "error": "Username required" }
  ```
- `404 Not Found` - Game doesn't exist
  ```json
  { "error": "Game not found" }
  ```
- `409 Conflict` - User already in game
  ```json
  { "error": "User already in game" }
  ```
- `500 Internal Server Error` - Server error

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
