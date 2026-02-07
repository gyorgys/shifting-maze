# Shifting Maze Documentation

Comprehensive documentation for the Shifting Maze multi-game hosting service.

## Overview

Shifting Maze is a web application that allows users to create accounts, authenticate, create games, and join games using unique codes. The system features:

- JWT-based authentication with secure password hashing
- Token-protected game endpoints
- Game creation with unique 4-letter codes
- Game joining by code
- File-based JSON persistence
- RESTful API architecture
- React-based UI with TypeScript

## Architecture

```
┌─────────────────────────────────────┐
│         Client (React)              │
│  - UI Components                    │
│  - Authentication State             │
│  - API Client                       │
└──────────────┬──────────────────────┘
               │ HTTP/JSON
               │
┌──────────────▼──────────────────────┐
│         Server (Express)            │
│  - REST API Routes                  │
│  - Business Logic Services          │
│  - File Storage                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      JSON File Storage              │
│  - server/data/users/*.json         │
│  - server/data/games/*.json         │
└─────────────────────────────────────┘
```

## Documentation Index

### Server Documentation

- **[Models](./server/models.md)** - Data structures for User and Game
- **[API Endpoints](./server/api-endpoints.md)** - REST API reference

### Client Documentation

- **[Components](./client/components.md)** - React component reference
- **[Types](./client/types.md)** - TypeScript type definitions
- **[Utilities](./client/utils.md)** - Utility functions and helpers

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Development

Run both servers in separate terminals:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:3001

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

## Key Features

### Authentication

- **Registration:** Users create accounts with username, display name, and password
- **Password Security:** Client-side SHA-256 hashing with per-user salts
- **JWT Tokens:** Server issues 24-hour JWT tokens upon successful login
- **Protected Endpoints:** All game operations require valid JWT token
- **Token Storage:** Client stores JWT in localStorage
- **Validation:** Strict username and password requirements

**Flow:**
1. User enters credentials in form
2. Client generates random salt (registration) or fetches existing salt (login)
3. Client hashes: `SHA-256(password + salt)`
4. Client sends hash to server
5. Server validates and returns user data

### Game Management

- **Create Games:** Generate unique 4-letter codes automatically
- **Join Games:** Users join by entering game codes and choosing colors
- **Player Colors:** Four colors available (red, green, blue, white)
- **Start Games:** 2-4 players required, player order randomized at start
- **Turn Tracking:** Game tracks current player and turn phase (shift/move)
- **Game Stages:** unstarted → playing → finished
- **List Games:** View all games user is participating in
- **Collision Prevention:** Retry logic for code generation
- **Duplicate Prevention:** Users cannot join same game twice or pick taken colors

**Game Code Format:**
- 4 uppercase letters (A-Z)
- Randomly generated
- 456,976 possible combinations
- Validated for uniqueness

**Game Flow:**
1. User creates game (stage: unstarted)
2. Players join and pick unique colors (2-4 players)
3. Someone starts the game (player order randomized)
4. Players take turns: shift phase → move phase
5. Game ends (stage: finished)

### Data Persistence

**File Structure:**
```
server/data/
├── users/
│   ├── john_doe.json
│   └── jane_smith.json
└── games/
    ├── ABCD.json
    └── WXYZ.json
```

**User File Example:**
```json
{
  "username": "john_doe",
  "displayName": "John Doe",
  "passwordHash": "a1b2c3...",
  "salt": "d4e5f6...",
  "createdAt": "2026-02-06T12:00:00.000Z"
}
```

**Game File Example (Unstarted):**
```json
{
  "code": "ABCD",
  "name": "Epic Adventure",
  "createdAt": "2026-02-06T12:00:00.000Z",
  "createdBy": "john_doe",
  "stage": "unstarted",
  "players": [
    { "username": "john_doe", "color": "red" },
    { "username": "jane_smith", "color": "blue" }
  ],
  "maxPlayers": 4
}
```

**Game File Example (Playing):**
```json
{
  "code": "ABCD",
  "name": "Epic Adventure",
  "createdAt": "2026-02-06T12:00:00.000Z",
  "createdBy": "john_doe",
  "stage": "playing",
  "players": [
    { "username": "alice", "color": "green" },
    { "username": "john_doe", "color": "red" },
    { "username": "jane_smith", "color": "blue" }
  ],
  "maxPlayers": 4,
  "currentPlayerIndex": 1,
  "currentPhase": "move",
  "board": [
    [10, 3, 11, 7, 11, 9, 9],
    [3, 10, 5, 11, 3, 6, 10],
    [14, 5, 14, 3, 11, 6, 13],
    [11, 10, 3, 5, 9, 3, 7],
    [14, 6, 7, 11, 13, 10, 13],
    [3, 10, 11, 9, 6, 5, 11],
    [6, 3, 7, 5, 7, 9, 5]
  ],
  "tileInPlay": 10,
  "playerPositions": {
    "green": [4, 2],
    "red": [2, 2],
    "blue": [2, 4]
  },
  "tokenPositions": {
    "0": [1, 1],
    "1": [1, 2],
    "2": [1, 3],
    "3": [1, 4],
    "4": [1, 5],
    "5": [2, 1],
    "6": [2, 3],
    "7": [2, 5],
    "8": [3, 1],
    "9": [3, 2],
    "10": [3, 3],
    "11": [3, 4],
    "12": [3, 5],
    "13": [4, 1],
    "14": [4, 3],
    "15": [4, 5],
    "16": [5, 1],
    "17": [5, 2],
    "18": [5, 3],
    "19": [5, 4],
    "20": [5, 5]
  },
  "collectedTokens": {
    "green": [],
    "red": [],
    "blue": []
  }
}
```

**Note:** Board tiles are represented as numbers (0-15) using bitmasks. See [Models documentation](./server/models.md#board-state-fields) for details on tile encoding.

## Technology Stack

### Server

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Storage:** JSON files (fs/promises)
- **Middleware:** CORS, JSON body parser

### Client

- **Framework:** React 18
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **Styling:** Inline CSS
- **State Management:** React hooks (useState, useEffect)
- **HTTP Client:** Fetch API

## Security Considerations

### Current Implementation (MVP)

✅ **Implemented:**
- Client-side password hashing (SHA-256)
- Per-user random salts
- Input validation (server and client)
- Path traversal prevention
- CORS configuration
- No plain passwords transmitted

⚠️ **Limitations:**
- localStorage can be cleared
- No server-side session management
- SHA-256 (fast, not ideal for passwords)
- No HTTPS in development
- No rate limiting

### Production Recommendations

For production deployment, consider:

- **Password Hashing:** Use bcrypt, scrypt, or Argon2 server-side
- **Sessions:** Implement JWT tokens with httpOnly cookies
- **Transport:** Use HTTPS for all communication
- **Rate Limiting:** Prevent brute force attacks
- **Database:** Migrate from JSON files to PostgreSQL/MongoDB
- **CSRF Protection:** Add CSRF tokens
- **Email Verification:** Require email confirmation
- **Password Reset:** Implement secure password recovery

## Testing

### Manual Testing

**Create Account:**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "displayName":"Test User",
    "passwordHash":"abc123hash",
    "salt":"def456salt"
  }'
```

**Create Game:**
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Game",
    "createdBy":"testuser"
  }'
```

**List Games:**
```bash
curl http://localhost:3001/api/games?username=testuser
```

### UI Testing

1. Open http://localhost:5173
2. Create an account
3. Create a game (note the code)
4. Logout
5. Create a second account
6. Join the game using the code
7. Verify both users see the game in their lists

## File Structure

```
shifting_maze/
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── models/         # Data models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Server entry
│   ├── data/               # JSON storage (gitignored)
│   │   ├── users/
│   │   └── games/
│   └── package.json
└── docs/                   # Documentation
    ├── server/
    └── client/
```

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user account |
| GET | `/api/users/:username/salt` | Get user's salt |
| POST | `/api/users/login` | Authenticate user |
| POST | `/api/games` | Create new game |
| GET | `/api/games?username=xxx` | List user's games |
| POST | `/api/games/:code/join` | Join game with color selection |
| PUT | `/api/games/:code/players/:username` | Update player's color (unstarted games only) |
| POST | `/api/games/:code/start` | Start game (randomize players, begin play) |

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add comments for complex logic
- Validate all inputs
- Handle errors gracefully

### Adding New Features

1. Update models if needed
2. Implement service logic
3. Add API routes
4. Create/update UI components
5. Update documentation
6. Test thoroughly

## License

This project is part of the Shifting Maze game system.
