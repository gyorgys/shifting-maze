# Shifting Maze - Game Rules

This document describes the high-level game rules and business logic implemented in the Shifting Maze project.

## Game Overview

Shifting Maze is a multiplayer board game where 2-4 players navigate a dynamically changing maze to collect tokens. Players take turns shifting the maze and moving their pieces to collect tokens of varying point values. The game combines strategic planning with spatial reasoning as the maze constantly changes.

## Board Structure

### Board Dimensions

- **Size**: 7×7 grid of tiles (49 tiles total on the board)
- **Extra Tile**: 1 "tile in play" kept off the board (50 tiles total in the game)

### Tile Types

Each tile represents a section of pathway with openings on 0-4 sides. Tiles are encoded as 4-bit bitmasks (values 0-15):

- **Bit 0 (0x1)**: Left side open
- **Bit 1 (0x2)**: Right side open
- **Bit 2 (0x4)**: Top side open
- **Bit 3 (0x8)**: Bottom side open

**Common Tile Patterns:**

| Type | Description | Bitmask | Hex | Example Codes | In Game? |
|------|-------------|---------|-----|---------------|----------|
| Dead End | 1 side only | Various | 0x1-0x8 | L, R, T, B | ❌ No |
| Corner | 2 adjacent sides | Various | 0x5-0xA | LT, RT, RB, LB | ✅ Yes |
| Straight | 2 opposite sides | 0011/1100 | 0x3/0xC | LR, TB | ✅ Yes |
| T-junction | 3 sides | Various | 0x7/0xB/0xD/0xE | LRT, LRB, LTB, RTB | ✅ Yes |
| Crossroads | 4 sides | 1111 | 0xF | LRTB | ❌ No |

**Important**: The game includes **only 3 tile types**: Corners, Straights, and T-junctions. There are **no dead-end tiles** (single opening) or **crossroads** (all four sides open). This design ensures that paths always have at least two connections, maintaining more interesting maze dynamics.

**Tile Shorthand Notation:**
- L = Left, R = Right, T = Top, B = Bottom
- Example: "LRB" = Left + Right + Bottom = 0xB

### Fixed Tiles (16 total)

These tiles are placed at fixed positions and never move during gameplay:

| Position | Tile | Hex | Description |
|----------|------|-----|-------------|
| (0,0) | RB | 0xA | Corner |
| (0,2) | LRB | 0xB | T-junction |
| (0,4) | LRB | 0xB | T-junction |
| (0,6) | LB | 0x9 | Corner |
| (2,0) | RTB | 0xE | T-junction |
| (2,2) | RTB | 0xE | T-junction (Red start) |
| (2,4) | LRB | 0xB | T-junction (Blue start) |
| (2,6) | LTB | 0xD | T-junction |
| (4,0) | RTB | 0xE | T-junction |
| (4,2) | LRT | 0x7 | T-junction (Green start) |
| (4,4) | LTB | 0xD | T-junction (White start) |
| (4,6) | LTB | 0xD | T-junction |
| (6,0) | RT | 0x6 | Corner |
| (6,2) | LRT | 0x7 | T-junction |
| (6,4) | LRT | 0x7 | T-junction |
| (6,6) | LT | 0x5 | Corner |

**Pattern**: Fixed tiles are placed at even row/column coordinates (0, 2, 4, 6).

### Free Tiles (34 total)

These tiles are randomly placed and rotated at game start:

- **15 Corner tiles** (RB base pattern, 0xA)
- **13 Straight tiles** (LR base pattern, 0x3)
- **6 T-junction tiles** (LRB base pattern, 0xB)

**Initialization Process:**
1. Create 34 tiles with base patterns
2. Shuffle the tiles randomly
3. Apply random rotation (0-3 × 90°) to each tile
4. Place 33 tiles on the board (filling non-fixed positions)
5. Keep 1 tile as the "tile in play"

### Board Initialization Algorithm

```
1. Create 7×7 grid filled with zeros
2. Place 16 fixed tiles at their predetermined positions
3. Create 34 free tiles (15 corners + 13 straight + 6 T-junctions)
4. Shuffle and randomly rotate the 34 free tiles
5. Place first 33 tiles into empty board positions
6. Set 34th tile as "tile in play" (off-board)
```

## Players

### Player Count

- **Minimum**: 2 players required to start
- **Maximum**: 4 players maximum

### Player Colors

Each player chooses one of four colors:
- **Red**
- **Green**
- **Blue**
- **White**

Each color can only be chosen by one player per game. Colors are chosen when joining the game.

### Starting Positions

Players start at fixed positions based on their color:

| Color | Position | Board Tile |
|-------|----------|------------|
| Red | (2, 2) | Fixed T-junction (RTB) |
| Blue | (2, 4) | Fixed T-junction (LRB) |
| Green | (4, 2) | Fixed T-junction (LRT) |
| White | (4, 4) | Fixed T-junction (LTB) |

**Note**: Starting positions are on fixed tiles in the interior of the board, providing balanced starting conditions.

### Player Order

- Randomized when the game starts
- Turn order is maintained throughout the game
- First player is randomly selected from all players

## Tokens and Scoring

### Token Distribution

- **Total Tokens**: 21 tokens (IDs 0-20)
- **Placement**: Randomly distributed on interior tiles at game start
- **Valid Positions**: Interior tiles only (rows 1-5, columns 1-5)
- **Excluded Positions**:
  - Edge tiles (row 0, row 6, col 0, col 6)
  - Player starting positions: (2,2), (2,4), (4,2), (4,4)
  - Results in exactly 21 valid positions (5×5 - 4 = 21)

### Token Values

| Token ID | Point Value |
|----------|-------------|
| 0 | 1 |
| 1 | 2 |
| 2 | 3 |
| ... | ... |
| 19 | 20 |
| 20 | 25 (special) |

**Scoring Formula**: `value = tokenId + 1` (except token 20 = 25)

### Token States

Tokens exist in one of two states:

1. **On Board**: Tracked in `tokenPositions` map (tokenId → position)
2. **Collected**: Tracked in `collectedTokens` map (playerColor → tokenId[])

**Collection**: When a player lands on a tile containing a token, they collect it (implementation pending).

## Game Stages

### 1. Unstarted

- **Initial State**: Game just created
- **Player Joining**: Players can join and choose colors
- **Requirements to Start**:
  - Minimum 2 players
  - Maximum 4 players
  - Only game creator can start the game
- **Actions Allowed**:
  - Join game
  - Change color
  - Leave game (not yet implemented)

### 2. Playing

- **Active Gameplay**: Players take turns
- **Turn Structure**: Each turn has two phases (shift → move)
- **Actions Allowed**:
  - Shift row/column (shift phase) - *implementation in progress*
  - Move player piece (move phase) - *implementation in progress*
  - Collect tokens (automatic when landing on token position) - *not yet implemented*

### 3. Finished

- **End State**: Game has concluded
- **Winning Condition**: *To be defined (likely highest score)*
- **Actions Allowed**: View final scores and game history

## Turn Structure

Each player's turn consists of two mandatory phases:

### Phase 1: Shift

**Objective**: Shift the maze to create a path for movement

**Mechanics** (*in development*):
1. Player rotates the "tile in play" to desired orientation (0-3 × 90°)
2. Player selects a row or column to shift
3. The tile in play is inserted, pushing all tiles in that row/column
4. The tile pushed off the board becomes the new "tile in play"
5. Player positions and token positions shift with the tiles

**Restrictions** (*planned*):
- Cannot reverse the previous player's shift immediately
- Must shift before moving

### Phase 2: Move

**Objective**: Move player piece to collect tokens

**Mechanics** (*in development*):
1. Player can move their piece along connected paths
2. Movement follows open sides of tiles
3. Can only move to tiles with valid path connections
4. Can move any distance along connected paths (in one direction or path)
5. If player lands on a tile with a token, they collect it

**Restrictions** (*planned*):
- Must stay on connected paths
- Cannot move through closed sides
- Must complete movement in current turn

### Turn Progression

```
Player 1: Shift → Move → Next Player
Player 2: Shift → Move → Next Player
Player 3: Shift → Move → Next Player
...continues until game end condition
```

## Game Flow

### 1. Game Creation

1. User creates a game with a name
2. System generates unique 4-letter code
3. Creator automatically joins as first player (color: red)
4. Game enters "unstarted" stage

### 2. Player Joining

1. Players join using the game code
2. Each player selects an available color
3. Colors are unique per game
4. Game can accept 2-4 players total

### 3. Game Start

1. Game creator initiates game start
2. System validates: 2-4 players present
3. Player order is randomized
4. Board is initialized:
   - Fixed tiles placed
   - Free tiles shuffled, rotated, and placed
   - One tile set aside as "tile in play"
   - Players placed at starting positions
   - Tokens placed at random interior positions
5. Game stage changes to "playing"
6. First player begins with shift phase

### 4. Active Gameplay

1. Current player completes shift phase
2. Current player completes move phase
3. Turn advances to next player
4. Repeat until end condition

### 5. Game End

- **Win Condition**: *To be defined*
- **Possible Conditions** (not yet implemented):
  - All tokens collected → highest score wins
  - Turn limit reached → highest score wins
  - Player completes specific objective → that player wins
- Game stage changes to "finished"

## Current Implementation Status

### Fully Implemented

- ✅ Game creation with unique codes
- ✅ Player registration and authentication
- ✅ Player joining and color selection
- ✅ Game start with board initialization
- ✅ Board generation (fixed tiles + randomized free tiles)
- ✅ Token placement on interior tiles
- ✅ Player starting positions
- ✅ Turn tracking (current player and phase)
- ✅ Client-side tile rotation animation
- ✅ Tile rendering with SVG paths

### In Development

- 🚧 Shift phase mechanics (inserting tile, pushing row/column)
- 🚧 Move phase mechanics (pathfinding, movement validation)
- 🚧 Token collection on landing
- 🚧 Turn progression (phase and player transitions)

### Not Yet Implemented

- ❌ Shift restrictions (preventing immediate reversal)
- ❌ Movement validation (path connectivity)
- ❌ Token collection triggering
- ❌ Score calculation
- ❌ Win condition detection
- ❌ Game end and final scoring
- ❌ Player leaving game
- ❌ Game history and replay

## Technical Implementation Notes

### Tile Rotation

Tiles can be rotated 90° clockwise. Rotation shifts the bitmask bits:
- Left → Top
- Top → Right
- Right → Bottom
- Bottom → Left

**Example**: RB (0xA = 1010) rotates to:
1. LB (0x9 = 1001)
2. LT (0x5 = 0101)
3. RT (0x6 = 0110)
4. RB (0xA = 1010) - back to original

### Data Storage

- **Users**: `server/data/users/{username}.json`
- **Games**: `server/data/games/{code}.json`
- **Format**: JSON files (development); should migrate to database for production

### Authentication

- JWT tokens valid for 24 hours
- Required for all game operations
- Token includes username and display name

## Related Documentation

- [Server Models](server/models.md) - Detailed data structure definitions
- [API Endpoints](server/api-endpoints.md) - Server API reference
- [Client Components](client/components.md) - React component documentation
- [Shared Types](../shared/README.md) - Shared type definitions
