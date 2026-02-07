import { Position } from '../types/Game';

/**
 * Calculate grid position offset for items when multiple tokens/players are on same tile
 * Items are arranged in a 2x2 grid when they overlap
 * @param itemKey The item identifier (token ID or player color)
 * @param allItemsAtTile All items at this tile position
 * @param gridSize The offset distance (default: 1/4 of tile size = 20px)
 * @returns Object with dx and dy offsets from tile center
 */
export function calculateGridPosition(
  itemKey: string | number,
  allItemsAtTile: (string | number)[],
  gridSize: number = 20  // 1/4 of 80px tile size
): { dx: number; dy: number } {
  const index = allItemsAtTile.indexOf(itemKey);

  // If item not found or only one item, center it
  if (index === -1 || allItemsAtTile.length === 1) {
    return { dx: 0, dy: 0 };
  }

  // 2x2 grid positions (clockwise from top-left)
  const positions = [
    { dx: -gridSize, dy: -gridSize },  // Top-left
    { dx: gridSize, dy: -gridSize },   // Top-right
    { dx: -gridSize, dy: gridSize },   // Bottom-left
    { dx: gridSize, dy: gridSize },    // Bottom-right
  ];

  return positions[index] || { dx: 0, dy: 0 };
}

/**
 * Get all items (tokens or players) at a specific tile position
 * @param row Row index
 * @param col Column index
 * @param positions Object mapping item keys to positions
 * @returns Array of item keys at this position
 */
export function getItemsAtPosition(
  row: number,
  col: number,
  positions: { [key: string]: Position }
): string[] {
  return Object.entries(positions)
    .filter(([_, pos]) => pos[0] === row && pos[1] === col)
    .map(([key]) => key);
}
