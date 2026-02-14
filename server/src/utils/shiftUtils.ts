import { Position, Tile } from '../models/Game';

/**
 * Shifts a row left or right, inserting a tile on one end and pushing one out the other.
 * Mutates the board array in place.
 * @returns The tile that was pushed off the board
 */
export function shiftRow(
  board: Tile[][],
  rowIndex: number,
  direction: 'left' | 'right',
  insertTile: Tile
): Tile {
  if (direction === 'left') {
    // Insert from right (col 6), push out left (col 0)
    const pushed = board[rowIndex][0];
    for (let col = 0; col < 6; col++) {
      board[rowIndex][col] = board[rowIndex][col + 1];
    }
    board[rowIndex][6] = insertTile;
    return pushed;
  } else {
    // Insert from left (col 0), push out right (col 6)
    const pushed = board[rowIndex][6];
    for (let col = 6; col > 0; col--) {
      board[rowIndex][col] = board[rowIndex][col - 1];
    }
    board[rowIndex][0] = insertTile;
    return pushed;
  }
}

/**
 * Shifts a column up or down, inserting a tile on one end and pushing one out the other.
 * Mutates the board array in place.
 * @returns The tile that was pushed off the board
 */
export function shiftColumn(
  board: Tile[][],
  colIndex: number,
  direction: 'up' | 'down',
  insertTile: Tile
): Tile {
  if (direction === 'up') {
    // Insert from bottom (row 6), push out top (row 0)
    const pushed = board[0][colIndex];
    for (let row = 0; row < 6; row++) {
      board[row][colIndex] = board[row + 1][colIndex];
    }
    board[6][colIndex] = insertTile;
    return pushed;
  } else {
    // Insert from top (row 0), push out bottom (row 6)
    const pushed = board[6][colIndex];
    for (let row = 6; row > 0; row--) {
      board[row][colIndex] = board[row - 1][colIndex];
    }
    board[0][colIndex] = insertTile;
    return pushed;
  }
}

/**
 * Updates positions of entities (players or tokens) in a shifted row.
 * Entities pushed off the board wrap to the opposite side (onto the inserted tile).
 * Mutates the positions object in place.
 */
export function updatePositionsInRow(
  rowIndex: number,
  direction: 'left' | 'right',
  positions: { [key: string]: Position }
): void {
  for (const [key, [row, col]] of Object.entries(positions)) {
    if (row === rowIndex) {
      if (direction === 'left') {
        // Tiles shift left: col decreases, col 0 wraps to col 6
        positions[key] = [row, col === 0 ? 6 : col - 1];
      } else {
        // Tiles shift right: col increases, col 6 wraps to col 0
        positions[key] = [row, col === 6 ? 0 : col + 1];
      }
    }
  }
}

/**
 * Updates positions of entities (players or tokens) in a shifted column.
 * Entities pushed off the board wrap to the opposite side (onto the inserted tile).
 * Mutates the positions object in place.
 */
export function updatePositionsInColumn(
  colIndex: number,
  direction: 'up' | 'down',
  positions: { [key: string]: Position }
): void {
  for (const [key, [row, col]] of Object.entries(positions)) {
    if (col === colIndex) {
      if (direction === 'up') {
        // Tiles shift up: row decreases, row 0 wraps to row 6
        positions[key] = [row === 0 ? 6 : row - 1, col];
      } else {
        // Tiles shift down: row increases, row 6 wraps to row 0
        positions[key] = [row === 6 ? 0 : row + 1, col];
      }
    }
  }
}
