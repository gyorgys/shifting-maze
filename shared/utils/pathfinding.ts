import type { Tile, Position } from '../types';

// Tile bitmask: bit 0=L, bit 1=R, bit 2=T, bit 3=B
function canPassBetween(board: Tile[][], from: Position, to: Position): boolean {
  const [fr, fc] = from;
  const [tr, tc] = to;
  const dr = tr - fr, dc = tc - fc;
  if (dr === 0 && dc === 1)  return !!(board[fr][fc] & 0x2) && !!(board[tr][tc] & 0x1); // right
  if (dr === 0 && dc === -1) return !!(board[fr][fc] & 0x1) && !!(board[tr][tc] & 0x2); // left
  if (dr === 1 && dc === 0)  return !!(board[fr][fc] & 0x8) && !!(board[tr][tc] & 0x4); // down
  if (dr === -1 && dc === 0) return !!(board[fr][fc] & 0x4) && !!(board[tr][tc] & 0x8); // up
  return false;
}

// BFS from start; returns a map of "r,c" → parent Position (null for start).
// Stops early when stopAt is reached (if provided).
function bfs(board: Tile[][], start: Position, stopAt?: string): Map<string, Position | null> {
  const rows = board.length;
  const cols = board[0].length;
  const parents = new Map<string, Position | null>();
  const queue: Position[] = [start];
  parents.set(`${start[0]},${start[1]}`, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = `${current[0]},${current[1]}`;
    if (currentKey === stopAt) break;

    const [r, c] = current;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (parents.has(key)) continue;
      if (canPassBetween(board, current, [nr, nc])) {
        parents.set(key, current);
        queue.push([nr, nc]);
      }
    }
  }

  return parents;
}

// Returns all positions reachable from start (including start itself)
export function findReachableTiles(board: Tile[][], start: Position): Position[] {
  return Array.from(bfs(board, start).keys()).map(k => {
    const [r, c] = k.split(',').map(Number);
    return [r, c] as Position;
  });
}

// Returns shortest path from start to end (includes both endpoints), or null if unreachable
export function findPath(board: Tile[][], start: Position, end: Position): Position[] | null {
  const endKey = `${end[0]},${end[1]}`;
  const parents = bfs(board, start, endKey);
  if (!parents.has(endKey)) return null;

  const path: Position[] = [];
  let pos: Position | null = end;
  while (pos !== null) {
    path.unshift(pos);
    pos = parents.get(`${pos[0]},${pos[1]}`) ?? null;
  }
  return path;
}
