import * as gameService from './gameService';
import * as userService from './userService';
import { shiftRow, shiftColumn, updatePositionsInRow, updatePositionsInColumn } from '../utils/shiftUtils';
import { findReachableTiles } from '@shared/utils/pathfinding';
import { rotateTileNTimes } from '@shared/utils/tileUtils';
import type { Position, Tile } from '../models/Game';

type Board = Tile[][];
type Positions = { [key: string]: Position };

function buildAnnotatedBoard(
  board: Board,
  playerPositions: Positions,
  tokenPositions: Positions,
  reachableSet: Set<string>
): object[][] {
  return board.map((row, r) =>
    row.map((tile, c) => {
      const key = `${r},${c}`;
      const players: string[] = [];
      for (const [color, [pr, pc]] of Object.entries(playerPositions)) {
        if (pr === r && pc === c) players.push(color);
      }
      let token: number | null = null;
      for (const [id, [tr, tc]] of Object.entries(tokenPositions)) {
        if (tr === r && tc === c) { token = Number(id); break; }
      }
      return { tile, reachable: reachableSet.has(key), token, players };
    })
  );
}

function getNextToken(tokenPositions: Positions): { id: number; value: number; position: Position } | null {
  const ids = Object.keys(tokenPositions).map(Number).sort((a, b) => a - b);
  if (ids.length === 0) return null;
  const id = ids[0];
  const value = id < 20 ? id + 1 : 25;
  return { id, value, position: tokenPositions[id] };
}

export async function getPossibleMoves(code: string, username: string): Promise<object> {
  // Validate test user
  const user = await userService.getUserByUsername(username);
  if (!user || user.passwordHash !== '') {
    throw new Error('Only test users (empty passwordHash) are authorized to use this endpoint');
  }

  // Load and validate game
  const game = await gameService.getGameByCode(code);
  if (!game) throw new Error('Game not found');
  if (game.stage !== 'playing') throw new Error('Game is not in progress');

  const playerIndex = game.players.findIndex(p => p.username === username);
  if (playerIndex === -1) throw new Error('User is not in this game');
  if (game.currentPlayerIndex !== playerIndex) throw new Error('Not your turn');

  const player = game.players[playerIndex];
  const color = player.color;
  const currentPlayerInfo = {
    color,
    username,
    position: game.playerPositions![color],
  };

  const otherPlayers = game.players
    .filter(p => p.username !== username)
    .map(p => ({ color: p.color, username: p.username, position: game.playerPositions![p.color] }));

  const nextTokenToCollect = getNextToken(game.tokenPositions!);

  if (game.currentPhase === 'shift') {
    const shiftTypes: Array<'row' | 'column'> = ['row', 'column'];
    const shiftIndices = [1, 3, 5];
    const rowDirections: Array<'left' | 'right'> = ['left', 'right'];
    const colDirections: Array<'up' | 'down'> = ['up', 'down'];
    const rotations = [0, 1, 2, 3];

    const possibleShifts: object[] = [];
    // Deduplicate by (shiftType, shiftIndex, direction, tileToInsert)
    const seen = new Set<string>();

    for (const shiftType of shiftTypes) {
      const directions = shiftType === 'row' ? rowDirections : colDirections;
      for (const shiftIndex of shiftIndices) {
        for (const direction of directions) {
          for (const rotation of rotations) {
            const tileToInsert = rotateTileNTimes(game.tileInPlay!, rotation);
            const dedupeKey = `${shiftType}:${shiftIndex}:${direction}:${tileToInsert}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);

            // Deep clone board
            const clonedBoard: Board = game.board!.map(r => [...r]);
            // Shallow clone positions
            const clonedPlayerPositions: Positions = { ...game.playerPositions! };
            const clonedTokenPositions: Positions = { ...game.tokenPositions! };

            // Apply shift
            if (shiftType === 'row') {
              shiftRow(clonedBoard, shiftIndex, direction as 'left' | 'right', tileToInsert);
              updatePositionsInRow(shiftIndex, direction as 'left' | 'right', clonedPlayerPositions);
              updatePositionsInRow(shiftIndex, direction as 'left' | 'right', clonedTokenPositions);
            } else {
              shiftColumn(clonedBoard, shiftIndex, direction as 'up' | 'down', tileToInsert);
              updatePositionsInColumn(shiftIndex, direction as 'up' | 'down', clonedPlayerPositions);
              updatePositionsInColumn(shiftIndex, direction as 'up' | 'down', clonedTokenPositions);
            }

            const newPlayerPos = clonedPlayerPositions[color];
            const reachablePositions = findReachableTiles(clonedBoard, newPlayerPos);
            const reachableSet = new Set(reachablePositions.map(([r, c]) => `${r},${c}`));

            let canReachNextToken = false;
            if (nextTokenToCollect) {
              const [tr, tc] = clonedTokenPositions[nextTokenToCollect.id] ?? nextTokenToCollect.position;
              canReachNextToken = reachableSet.has(`${tr},${tc}`);
            }

            const annotatedBoard = buildAnnotatedBoard(
              clonedBoard,
              clonedPlayerPositions,
              clonedTokenPositions,
              reachableSet
            );

            possibleShifts.push({
              shiftType,
              shiftIndex,
              direction,
              rotation,
              tileToInsert,
              playerPositionAfterShift: newPlayerPos,
              reachableTileCount: reachableSet.size,
              canReachNextToken,
              board: annotatedBoard,
            });
          }
        }
      }
    }

    return {
      phase: 'shift',
      tileInPlay: game.tileInPlay,
      currentPlayer: currentPlayerInfo,
      otherPlayers,
      nextTokenToCollect,
      possibleShifts,
    };
  } else {
    // move phase
    const currentPos = game.playerPositions![color];
    const reachablePositions = findReachableTiles(game.board!, currentPos);
    const reachableSet = new Set(reachablePositions.map(([r, c]: Position) => `${r},${c}`));

    const annotatedBoard = buildAnnotatedBoard(
      game.board!,
      game.playerPositions!,
      game.tokenPositions!,
      reachableSet
    );

    const nextTokenWithReachable = nextTokenToCollect
      ? {
          ...nextTokenToCollect,
          reachable: reachableSet.has(`${nextTokenToCollect.position[0]},${nextTokenToCollect.position[1]}`),
        }
      : null;

    return {
      phase: 'move',
      currentPlayer: currentPlayerInfo,
      otherPlayers,
      nextTokenToCollect: nextTokenWithReachable,
      board: annotatedBoard,
      reachableTiles: reachablePositions,
    };
  }
}
