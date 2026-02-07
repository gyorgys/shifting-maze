import { createTile, rotateTileNTimes } from './tileUtils';
import { Position, Tile, TokenId } from '../models/Game';

/**
 * Returns a map of fixed tile positions
 * Key format: "row,col" (e.g., "0,0")
 * Value: tile bitmask
 */
function getFixedTilePositions(): Map<string, Tile> {
  const fixed = new Map<string, Tile>();

  // Row 0
  fixed.set('0,0', createTile('RB'));   // 0xA
  fixed.set('0,2', createTile('LRB'));  // 0xB
  fixed.set('0,4', createTile('LRB'));  // 0xB
  fixed.set('0,6', createTile('LB'));   // 0x9

  // Row 2
  fixed.set('2,0', createTile('RTB'));  // 0xE
  fixed.set('2,2', createTile('RTB'));  // 0xE
  fixed.set('2,4', createTile('LRB'));  // 0xB
  fixed.set('2,6', createTile('LTB'));  // 0xD

  // Row 4
  fixed.set('4,0', createTile('RTB'));  // 0xE
  fixed.set('4,2', createTile('LRT'));  // 0x7
  fixed.set('4,4', createTile('LTB'));  // 0xD
  fixed.set('4,6', createTile('LTB'));  // 0xD

  // Row 6
  fixed.set('6,0', createTile('RT'));   // 0x6
  fixed.set('6,2', createTile('LRT'));  // 0x7
  fixed.set('6,4', createTile('LRT'));  // 0x7
  fixed.set('6,6', createTile('LT'));   // 0x5

  return fixed;
}

/**
 * Creates the 34 free tiles (unrotated)
 * - 15 RB (corner)
 * - 13 LR (straight)
 * - 6 LRB (T-junction)
 */
function createFreeTiles(): Tile[] {
  const tiles: Tile[] = [];

  // 15 corner tiles (RB)
  const cornerTile = createTile('RB');
  for (let i = 0; i < 15; i++) {
    tiles.push(cornerTile);
  }

  // 13 straight tiles (LR)
  const straightTile = createTile('LR');
  for (let i = 0; i < 13; i++) {
    tiles.push(straightTile);
  }

  // 6 T-junction tiles (LRB)
  const tJunctionTile = createTile('LRB');
  for (let i = 0; i < 6; i++) {
    tiles.push(tJunctionTile);
  }

  return tiles;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffles tiles and randomly rotates each one
 */
function shuffleAndRotateTiles(tiles: Tile[]): Tile[] {
  const shuffled = shuffleArray(tiles);

  // Randomly rotate each tile (0-3 times)
  return shuffled.map(tile => {
    const rotations = Math.floor(Math.random() * 4);
    return rotateTileNTimes(tile, rotations);
  });
}

/**
 * Initializes a new game board with fixed tiles and randomly placed free tiles
 * @returns Object containing the 7x7 board and the tile in play
 */
export function initializeBoard(): { board: Tile[][], tileInPlay: Tile } {
  // 1. Create 7x7 board filled with 0s
  const board: Tile[][] = Array(7).fill(null).map(() => Array(7).fill(0));

  // 2. Place fixed tiles at their positions
  const fixedTiles = getFixedTilePositions();
  for (const [pos, tile] of fixedTiles) {
    const [row, col] = pos.split(',').map(Number);
    board[row][col] = tile;
  }

  // 3. Create free tiles (15 RB, 13 LR, 6 LRB)
  const freeTiles = createFreeTiles();

  // 4. Shuffle and randomly rotate the free tiles
  const shuffledTiles = shuffleAndRotateTiles(freeTiles);

  // 5. Place 33 tiles on board, keep last as tileInPlay
  let tileIndex = 0;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] === 0) { // If not a fixed tile
        board[row][col] = shuffledTiles[tileIndex++];
      }
    }
  }

  const tileInPlay = shuffledTiles[33]; // Last tile (index 33)

  return { board, tileInPlay };
}

/**
 * Gets the point value of a token
 * Tokens 0-19 have values 1-20, token 20 has value 25
 */
export function getTokenValue(tokenId: TokenId): number {
  if (tokenId >= 0 && tokenId <= 19) {
    return tokenId + 1; // Token 0 = 1 point, token 1 = 2 points, ..., token 19 = 20 points
  } else if (tokenId === 20) {
    return 25;
  }
  throw new Error(`Invalid token ID: ${tokenId}`);
}

/**
 * Initializes token positions on the board
 * Places 21 tokens (IDs 0-20) on interior tiles, excluding edges and player starting positions
 * @returns Map of token ID to position
 */
export function initializeTokens(): { [tokenId: string]: Position } {
  // Get all valid positions for tokens
  // Interior tiles (rows 1-5, cols 1-5) excluding player starting positions
  const playerStartPositions = new Set(['2,2', '2,4', '4,2', '4,4']);
  const validPositions: Position[] = [];

  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) {
      const posKey = `${row},${col}`;
      if (!playerStartPositions.has(posKey)) {
        validPositions.push([row, col]);
      }
    }
  }

  // Should have exactly 21 valid positions (5x5 - 4 player starts = 21)
  if (validPositions.length !== 21) {
    throw new Error(`Expected 21 valid token positions, got ${validPositions.length}`);
  }

  // Shuffle the positions
  const shuffledPositions = shuffleArray(validPositions);

  // Assign tokens 0-20 to the shuffled positions
  const tokenPositions: { [tokenId: string]: Position } = {};
  for (let tokenId = 0; tokenId <= 20; tokenId++) {
    tokenPositions[tokenId.toString()] = shuffledPositions[tokenId];
  }

  return tokenPositions;
}
