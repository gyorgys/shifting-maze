import { createTile, rotateTileNTimes } from './tileUtils';

/**
 * Returns a map of fixed tile positions
 * Key format: "row,col" (e.g., "0,0")
 * Value: tile bitmask
 */
function getFixedTilePositions(): Map<string, number> {
  const fixed = new Map<string, number>();

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
function createFreeTiles(): number[] {
  const tiles: number[] = [];

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
function shuffleAndRotateTiles(tiles: number[]): number[] {
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
export function initializeBoard(): { board: number[][], tileInPlay: number } {
  // 1. Create 7x7 board filled with 0s
  const board: number[][] = Array(7).fill(null).map(() => Array(7).fill(0));

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
