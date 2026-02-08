import type { Tile } from '../types';

// Tile bit positions for bitmask representation
// Each tile has 4 sides that can be open (1) or closed (0)
export const LEFT = 0x1;    // Bit 0
export const RIGHT = 0x2;   // Bit 1
export const TOP = 0x4;     // Bit 2
export const BOTTOM = 0x8;  // Bit 3

/**
 * Rotates a tile 90 degrees clockwise
 * L → T, T → R, R → B, B → L
 */
export function rotateTileClockwise(tile: Tile): Tile {
  const hasLeft = !!(tile & LEFT);
  const hasRight = !!(tile & RIGHT);
  const hasTop = !!(tile & TOP);
  const hasBottom = !!(tile & BOTTOM);

  // CW rotation: LEFT->TOP, TOP->RIGHT, RIGHT->BOTTOM, BOTTOM->LEFT
  let rotated = 0;
  if (hasLeft) rotated |= TOP;
  if (hasTop) rotated |= RIGHT;
  if (hasRight) rotated |= BOTTOM;
  if (hasBottom) rotated |= LEFT;

  return rotated;
}

/**
 * Rotates a tile 90 degrees counter-clockwise
 * L → B, B → R, R → T, T → L
 */
export function rotateTileCounterClockwise(tile: Tile): Tile {
  const hasLeft = !!(tile & LEFT);
  const hasRight = !!(tile & RIGHT);
  const hasTop = !!(tile & TOP);
  const hasBottom = !!(tile & BOTTOM);

  // CCW rotation: LEFT->BOTTOM, BOTTOM->RIGHT, RIGHT->TOP, TOP->LEFT
  let rotated = 0;
  if (hasLeft) rotated |= BOTTOM;
  if (hasBottom) rotated |= RIGHT;
  if (hasRight) rotated |= TOP;
  if (hasTop) rotated |= LEFT;

  return rotated;
}

/**
 * Rotates a tile N times (0-3) clockwise
 * @param tile The tile to rotate
 * @param n Number of 90-degree rotations (0-3)
 */
export function rotateTileNTimes(tile: Tile, n: number): Tile {
  let rotated = tile;
  for (let i = 0; i < (n % 4); i++) {
    rotated = rotateTileClockwise(rotated);
  }
  return rotated;
}

/**
 * Creates a tile from a string notation like "RB", "LRT", etc.
 * L = Left, R = Right, T = Top, B = Bottom
 */
export function createTile(sides: string): Tile {
  let tile = 0;
  const upper = sides.toUpperCase();

  if (upper.includes('L')) tile |= LEFT;
  if (upper.includes('R')) tile |= RIGHT;
  if (upper.includes('T')) tile |= TOP;
  if (upper.includes('B')) tile |= BOTTOM;

  return tile;
}

/**
 * Gets the string representation of a tile for debugging
 * Returns sides in alphabetical order (BLRT)
 */
export function getTileSides(tile: Tile): string {
  const sides: string[] = [];

  if (tile & BOTTOM) sides.push('B');
  if (tile & LEFT) sides.push('L');
  if (tile & RIGHT) sides.push('R');
  if (tile & TOP) sides.push('T');

  return sides.join('');
}
