# Shared Code

This directory contains utilities and types shared between the client and server.

## Purpose

Eliminates code duplication by providing a single source of truth for:
- Game-related type definitions (PlayerColor, GameStage, Position, etc.)
- Tile manipulation utilities (rotation, creation, validation)
- Tile bitmask constants (LEFT, RIGHT, TOP, BOTTOM)

## Structure

```
shared/
├── utils/
│   └── tileUtils.ts      # Tile manipulation functions and constants
├── types/
│   ├── game.ts           # Game-related type definitions
│   └── index.ts          # Type exports
└── package.json          # Package metadata
```

## Usage

### In Client

Import utilities and types from `@shared`:

```typescript
// Import types
import type { PlayerColor, Player, Position } from '@shared/types';

// Import utilities
import { rotateTileClockwise, LEFT, RIGHT, TOP, BOTTOM } from '@shared/utils/tileUtils';
```

### In Server

Import utilities and types from `@shared`:

```typescript
// Import types
import type { PlayerColor, Tile, Position } from '@shared/types';

// Import utilities
import { rotateTileClockwise, createTile, getTileSides } from '@shared/utils/tileUtils';
```

## Configuration

### Client Setup

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src", "../shared"]
}
```

**vite.config.ts:**
```javascript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
});
```

### Server Setup

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*", "../shared/**/*"]
}
```

## Available Types

### Game Types

**`PlayerColor`**
- Type: `'red' | 'green' | 'blue' | 'white'`
- Player colors available in the game

**`GameStage`**
- Type: `'unstarted' | 'playing' | 'finished'`
- Game lifecycle stages

**`TurnPhase`**
- Type: `'shift' | 'move'`
- Turn phases during gameplay

**`Position`**
- Type: `[number, number]`
- Board position coordinates [row, col]

**`Tile`**
- Type: `number`
- Tile representation (0-15, 4-bit bitmask for L/R/T/B sides)

**`TokenId`**
- Type: `number`
- Token identifier (0-20)

**`Player`**
- Interface with `username: string` and `color: PlayerColor`
- Represents a player in a game

**`CurrentTurn`**
- Interface with `username: string`, `color: PlayerColor`, and `phase: TurnPhase`
- Represents the current turn state

### Usage Example

```typescript
import type { PlayerColor, Player, Position } from '@shared/types';

const player: Player = {
  username: 'alice',
  color: 'red'
};

const position: Position = [3, 4];
```

## Available Utilities

### Tile Constants

```typescript
export const LEFT = 0x1;    // Bit 0
export const RIGHT = 0x2;   // Bit 1
export const TOP = 0x4;     // Bit 2
export const BOTTOM = 0x8;  // Bit 3
```

### Tile Functions

**`rotateTileClockwise(tile: Tile): Tile`**
- Rotates a tile 90 degrees clockwise
- Rotation mapping: LEFT→TOP, TOP→RIGHT, RIGHT→BOTTOM, BOTTOM→LEFT

**`rotateTileCounterClockwise(tile: Tile): Tile`**
- Rotates a tile 90 degrees counter-clockwise
- Rotation mapping: LEFT→BOTTOM, BOTTOM→RIGHT, RIGHT→TOP, TOP→LEFT

**`rotateTileNTimes(tile: Tile, n: number): Tile`**
- Rotates a tile N times (0-3) clockwise
- Handles modulo 4 automatically

**`createTile(sides: string): Tile`**
- Creates a tile from string notation like "RB", "LRT", etc.
- L = Left, R = Right, T = Top, B = Bottom

**`getTileSides(tile: Tile): string`**
- Gets string representation of a tile for debugging
- Returns sides in alphabetical order (BLRT)

## Benefits

1. **No Code Duplication**: Types and utilities exist in one place
2. **Consistency**: Client and server use identical types and logic
3. **Maintainability**: Fix bugs or add features once
4. **Type Safety**: TypeScript paths ensure correct imports and type checking
5. **Build Verification**: Both builds verify shared code compiles correctly
6. **Single Source of Truth**: Game rules and data structures defined once

## What's Shared vs. What's Not

### Shared (in this directory)
- ✅ Game domain types (PlayerColor, GameStage, TurnPhase, Position, Tile, TokenId, Player, CurrentTurn)
- ✅ Tile manipulation utilities (rotation, creation, validation)
- ✅ Tile bitmask constants (LEFT, RIGHT, TOP, BOTTOM)

### Client-Specific (client/src/types/)
- Form data types (CreateGameFormData, JoinGameFormData, etc.)
- Client User interface (includes JWT token)
- Client Game interface (uses CurrentTurn instead of currentPlayerIndex)

### Server-Specific (server/src/models/)
- Server User interface (includes passwordHash, salt, createdAt)
- Server Game interface (uses currentPlayerIndex/currentPhase)
- API Request/Response types

## Future Enhancements

- Add board manipulation utilities if needed on client
- Consider adding validation utilities
- Add unit tests for shared utilities
- Potential to share more API types if client/server converge
