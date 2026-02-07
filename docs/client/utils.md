# Client Utilities

This document describes utility functions used in the Shifting Maze client application.

## Grid Positioning Utility

**File:** [client/src/utils/gridPositioning.ts](../../client/src/utils/gridPositioning.ts)

### Purpose

Handles layout calculations when multiple game items (tokens and/or players) occupy the same tile. Items are arranged in a 2×2 grid within the tile to prevent visual overlap.

---

### calculateGridPosition

Calculates the offset position for an item within a tile when multiple items share the same space.

**Signature:**
```typescript
function calculateGridPosition(
  itemKey: string | number,
  allItemsAtTile: (string | number)[],
  gridSize?: number
): { dx: number; dy: number }
```

**Parameters:**
- `itemKey` - The identifier for this item (token ID or player color)
- `allItemsAtTile` - Array of all item keys at this tile position
- `gridSize` - Distance from center for grid positions (default: 20px = 1/4 of 80px tile)

**Returns:**
Object with `dx` and `dy` offsets from the tile center

**Behavior:**
- If only one item at tile: returns `{ dx: 0, dy: 0 }` (centered)
- If multiple items: assigns to 2×2 grid positions based on index

**Grid Layout:**
```
┌─────────────┬─────────────┐
│  (-20, -20) │  (+20, -20) │
│   Index 0   │   Index 1   │
├─────────────┼─────────────┤
│  (-20, +20) │  (+20, +20) │
│   Index 2   │   Index 3   │
└─────────────┴─────────────┘
```

**Example:**
```typescript
// Three items on the same tile
const items = ['0', 'red', '5'];  // token 0, red player, token 5

// Token 0 (index 0)
const offset0 = calculateGridPosition('0', items);
// Returns: { dx: -20, dy: -20 } (top-left)

// Red player (index 1)
const offsetRed = calculateGridPosition('red', items);
// Returns: { dx: 20, dy: -20 } (top-right)

// Token 5 (index 2)
const offset5 = calculateGridPosition('5', items);
// Returns: { dx: -20, dy: 20 } (bottom-left)
```

**Usage in Components:**
```tsx
// In Token or PlayerMarker component
const allItemsAtTile = [
  ...getItemsAtPosition(row, col, tokenPositions),
  ...getItemsAtPosition(row, col, playerPositions)
];

const gridOffset = calculateGridPosition(
  tokenId,
  allItemsAtTile,
  tileSize * 0.25
);

// Apply offset to position
const cx = tileX + tileSize / 2 + gridOffset.dx;
const cy = tileY + tileSize / 2 + gridOffset.dy;
```

---

### getItemsAtPosition

Retrieves all items located at a specific tile position.

**Signature:**
```typescript
function getItemsAtPosition(
  row: number,
  col: number,
  positions: { [key: string]: Position }
): string[]
```

**Parameters:**
- `row` - Row index (0-6)
- `col` - Column index (0-6)
- `positions` - Map of item keys to positions (e.g., `tokenPositions` or `playerPositions`)

**Returns:**
Array of item keys (strings) at the specified position

**Example:**
```typescript
const tokenPositions = {
  '0': [1, 1],
  '1': [1, 3],
  '2': [1, 1],  // Same as token 0
};

const tokensAt_1_1 = getItemsAtPosition(1, 1, tokenPositions);
// Returns: ['0', '2']

const tokensAt_1_3 = getItemsAtPosition(1, 3, tokenPositions);
// Returns: ['1']

const tokensAt_2_2 = getItemsAtPosition(2, 2, tokenPositions);
// Returns: []
```

**Usage:**
```typescript
// Get all tokens at a position
const tokensHere = getItemsAtPosition(row, col, tokenPositions);

// Get all players at a position
const playersHere = getItemsAtPosition(row, col, playerPositions);

// Combine for total count
const allItemsHere = [...tokensHere, ...playersHere];
console.log(`${allItemsHere.length} items at (${row}, ${col})`);
```

---

## Complete Usage Example

Here's how the grid positioning utilities are used together in the GameBoard component:

```typescript
// In GameBoard.tsx
import { calculateGridPosition, getItemsAtPosition } from '../utils/gridPositioning';

// Rendering a token
{Object.entries(tokenPositions).map(([tokenId, [row, col]]) => {
  // Step 1: Get all items at this tile
  const tokensAtPos = getItemsAtPosition(row, col, tokenPositions);
  const playersAtPos = getItemsAtPosition(row, col, playerPositions);
  const allItemsAtPos = [...tokensAtPos, ...playersAtPos];

  // Step 2: Calculate grid offset for this specific token
  const gridOffset = calculateGridPosition(
    tokenId,
    allItemsAtPos,
    tileSize * 0.25
  );

  // Step 3: Render token with offset
  return (
    <Token
      key={`token-${tokenId}`}
      tokenId={parseInt(tokenId)}
      x={col * tileSize}
      y={row * tileSize}
      gridOffset={gridOffset}
      tileSize={tileSize}
    />
  );
})}
```

**Visual Result:**

When multiple items share a tile, they're automatically arranged:

```
Single item:          Two items:           Three items:         Four items:
   ┌───┐                ┌───┐                ┌───┐                ┌───┐
   │   │                │●○ │                │●○ │                │●○ │
   │ ● │                │   │                │● ░│                │●░░│
   │   │                │   │                │   │                │   │
   └───┘                └───┘                └───┘                └───┘
 Centered            Top-left/right    Top-left/right      All four corners
                                        Bottom-left
```

---

## Implementation Notes

### Why Grid Layout?

Without grid positioning, multiple tokens/players on the same tile would:
1. Overlap completely (invisible)
2. Need manual positioning (error-prone)
3. Look cluttered and confusing

The 2×2 grid provides:
- Automatic spacing
- Consistent layout
- Clear visual separation
- Up to 4 items per tile (sufficient for game rules)

### Coordinate System

The client uses the same coordinate system as the server:
- `Position = [row, col]`
- `row`: 0 (top) to 6 (bottom)
- `col`: 0 (left) to 6 (right)
- Origin (0,0) is top-left corner

### Performance

These utilities are called during render for each token and player. They're designed to be:
- Fast: Simple array operations
- Pure: No side effects
- Predictable: Same inputs always give same outputs
