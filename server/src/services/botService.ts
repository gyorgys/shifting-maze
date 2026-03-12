import { Game, Tile, Position } from '../models/Game';
import { shiftRow, shiftColumn, updatePositionsInRow, updatePositionsInColumn } from '../utils/shiftUtils';
import { findReachableTiles } from '@shared/utils/pathfinding';
import { rotateTileNTimes } from '@shared/utils/tileUtils';
import { getTokenValue } from '../utils/boardUtils';
import { PlayerColor } from '@shared/types';

// ── Internal types ────────────────────────────────────────────────────────────

interface BotState {
  board: Tile[][];
  tileInPlay: Tile;
  playerPositions: Position[];         // indexed by playerIndex
  tokenPositions: (Position | null)[]; // indexed by tokenId 0..20; null = collected
  collectedScores: number[];           // accumulated points per playerIndex
  currentPlayerIndex: number;
  numPlayers: number;
  lastShift: { shiftType: 'row' | 'column'; shiftIndex: number; direction: string } | null;
  isFinished: boolean;
}

interface BotTurn {
  shiftType: 'row' | 'column';
  shiftIndex: 1 | 3 | 5;
  direction: 'left' | 'right' | 'up' | 'down';
  tileToInsert: Tile;
  moveTo: Position;
  resultingStateKey: string; // stateKey of the state after applying this turn (precomputed)
}

interface TTEntry {
  score: number;
  flag: 'EXACT' | 'LOWER' | 'UPPER';
  bestTurn: BotTurn | null;
}

const OPPOSITE_DIR: Record<string, string> = { left: 'right', right: 'left', up: 'down', down: 'up' };

// Module-level caches; cleared at the start of each getBestMoves call
const turnsCache = new Map<string, BotTurn[]>();
const transpositionTable = new Map<string, TTEntry>();

// ── Conversion ────────────────────────────────────────────────────────────────

function gameToBotState(game: Game): BotState {
  const players = game.players;
  const numPlayers = players.length;

  const playerPositions: Position[] = players.map(p => {
    const pos = game.playerPositions![p.color];
    return [pos[0], pos[1]];
  });

  const tokenPositions: (Position | null)[] = [];
  for (let id = 0; id <= 20; id++) {
    const pos = game.tokenPositions![id.toString()];
    tokenPositions.push(pos ? [pos[0], pos[1]] : null);
  }

  const collectedScores: number[] = players.map(p => {
    const tokens = game.collectedTokens![p.color] ?? [];
    return tokens.reduce((sum, id) => sum + getTokenValue(id), 0);
  });

  return {
    board: game.board!.map(row => [...row]),
    tileInPlay: game.tileInPlay!,
    playerPositions,
    tokenPositions,
    collectedScores,
    currentPlayerIndex: game.currentPlayerIndex!,
    numPlayers,
    lastShift: game.lastShift ?? null,
    isFinished: false,
  };
}

// ── State key ─────────────────────────────────────────────────────────────────

function stateKey(state: BotState): string {
  return state.board.map(r => r.join(',')).join('|')
    + '!' + state.tileInPlay
    + '!' + state.playerPositions.map(p => p.join(',')).join(';')
    + '!' + state.tokenPositions.map(p => p ? p.join(',') : 'x').join(';')
    + '!' + state.currentPlayerIndex
    + '!' + (state.lastShift
      ? `${state.lastShift.shiftType}:${state.lastShift.shiftIndex}:${state.lastShift.direction}`
      : '-');
}

// ── Turn generation ───────────────────────────────────────────────────────────

function generateTurns(state: BotState): BotTurn[] {
  const { board, tileInPlay, playerPositions, tokenPositions,
          currentPlayerIndex, numPlayers, lastShift } = state;

  const allTurns: BotTurn[] = [];
  const tokenCollectingTurns: BotTurn[] = [];

  // Find the lowest token ID still on board (pre-shift; doesn't change during shift)
  let lowestId: number | null = null;
  for (let id = 0; id <= 20; id++) {
    if (tokenPositions[id] !== null) { lowestId = id; break; }
  }

  const shiftTypes: Array<'row' | 'column'> = ['row', 'column'];
  const shiftIndices: Array<1 | 3 | 5> = [1, 3, 5];

  for (const shiftType of shiftTypes) {
    const directions: ('left' | 'right' | 'up' | 'down')[] =
      shiftType === 'row' ? ['left', 'right'] : ['up', 'down'];

    for (const shiftIndex of shiftIndices) {
      for (const direction of directions) {
        // Anti-slide rule
        if (lastShift &&
            lastShift.shiftType === shiftType &&
            lastShift.shiftIndex === shiftIndex &&
            direction === OPPOSITE_DIR[lastShift.direction]) {
          continue;
        }

        // Try each rotation of the tile in play, deduping symmetric tiles
        const seenTiles = new Set<number>();
        for (let rot = 0; rot < 4; rot++) {
          const tile = rotateTileNTimes(tileInPlay, rot);
          if (seenTiles.has(tile)) continue;
          seenTiles.add(tile);

          // Clone board and positions for this shift
          const clonedBoard = board.map(row => [...row]);
          const clonedPlayerPos: Position[] = playerPositions.map(p => [p[0], p[1]] as Position);
          const clonedTokenPos: (Position | null)[] = tokenPositions.map(p => p ? [p[0], p[1]] as Position : null);

          // Build string-keyed position maps for shift utilities
          const playerPosMap: { [key: string]: Position } = {};
          for (let i = 0; i < numPlayers; i++) {
            playerPosMap[i.toString()] = clonedPlayerPos[i];
          }
          const tokenPosMap: { [key: string]: Position } = {};
          for (let id = 0; id <= 20; id++) {
            if (clonedTokenPos[id] !== null) {
              tokenPosMap[id.toString()] = clonedTokenPos[id]!;
            }
          }

          // Apply shift
          let pushedTile: Tile;
          if (shiftType === 'row') {
            pushedTile = shiftRow(clonedBoard, shiftIndex, direction as 'left' | 'right', tile);
            updatePositionsInRow(shiftIndex, direction as 'left' | 'right', playerPosMap);
            updatePositionsInRow(shiftIndex, direction as 'left' | 'right', tokenPosMap);
          } else {
            pushedTile = shiftColumn(clonedBoard, shiftIndex, direction as 'up' | 'down', tile);
            updatePositionsInColumn(shiftIndex, direction as 'up' | 'down', playerPosMap);
            updatePositionsInColumn(shiftIndex, direction as 'up' | 'down', tokenPosMap);
          }

          // Write positions back from maps
          for (let i = 0; i < numPlayers; i++) {
            clonedPlayerPos[i] = playerPosMap[i.toString()];
          }
          for (let id = 0; id <= 20; id++) {
            if (tokenPosMap[id.toString()]) {
              clonedTokenPos[id] = tokenPosMap[id.toString()];
            }
          }

          // Post-shift position of lowest token (may have moved with the shift)
          const newLowestPos = lowestId !== null ? clonedTokenPos[lowestId] : null;

          // Pre-compute the parts of the resulting key that are the same for all destinations
          const boardKey = clonedBoard.map(r => r.join(',')).join('|');
          const nextPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
          const shiftSuffix = '!' + nextPlayerIndex
            + '!' + `${shiftType}:${shiftIndex}:${direction}`;
          const baseTokenStr = clonedTokenPos.map(p => p ? p.join(',') : 'x').join(';');
          // Token string with lowestId collected (for collecting turns)
          let collectedTokenStr: string | null = null;
          if (lowestId !== null) {
            const t = [...clonedTokenPos];
            t[lowestId] = null;
            collectedTokenStr = t.map(p => p ? p.join(',') : 'x').join(';');
          }

          const playerPosAfterShift = clonedPlayerPos[currentPlayerIndex];
          const reachable = findReachableTiles(clonedBoard, playerPosAfterShift);

          for (const dest of reachable) {
            const collectsToken = newLowestPos !== null &&
              dest[0] === newLowestPos[0] && dest[1] === newLowestPos[1];

            // Build tempPlayerPos: same as clonedPlayerPos but with current player at dest
            const tempPlayerPosStr = clonedPlayerPos
              .map((p, i) => i === currentPlayerIndex ? dest.join(',') : p.join(','))
              .join(';');

            const tokenStr = collectsToken ? collectedTokenStr! : baseTokenStr;
            const resultingKey = boardKey + '!' + pushedTile + '!' + tempPlayerPosStr + '!' + tokenStr + shiftSuffix;

            const turn: BotTurn = {
              shiftType,
              shiftIndex,
              direction,
              tileToInsert: tile,
              moveTo: dest,
              resultingStateKey: resultingKey,
            };

            if (collectsToken) {
              tokenCollectingTurns.push(turn);
            } else {
              allTurns.push(turn);
            }
          }
        }
      }
    }
  }

  // Pruning: if any move collects the next token, discard all non-collecting moves
  return tokenCollectingTurns.length > 0 ? tokenCollectingTurns : allTurns;
}

// ── Apply turn (pure) ─────────────────────────────────────────────────────────

function applyTurn(state: BotState, turn: BotTurn): BotState {
  const { board, playerPositions, tokenPositions, collectedScores,
          currentPlayerIndex, numPlayers } = state;

  const newBoard = board.map(row => [...row]);
  const newPlayerPos: Position[] = playerPositions.map(p => [p[0], p[1]] as Position);
  const newTokenPos: (Position | null)[] = tokenPositions.map(p => p ? [p[0], p[1]] as Position : null);
  const newScores: number[] = [...collectedScores];

  // Build string-keyed position maps
  const playerPosMap: { [key: string]: Position } = {};
  for (let i = 0; i < numPlayers; i++) {
    playerPosMap[i.toString()] = newPlayerPos[i];
  }
  const tokenPosMap: { [key: string]: Position } = {};
  for (let id = 0; id <= 20; id++) {
    if (newTokenPos[id] !== null) {
      tokenPosMap[id.toString()] = newTokenPos[id]!;
    }
  }

  // Apply shift
  let pushedTile: Tile;
  if (turn.shiftType === 'row') {
    pushedTile = shiftRow(newBoard, turn.shiftIndex, turn.direction as 'left' | 'right', turn.tileToInsert);
    updatePositionsInRow(turn.shiftIndex, turn.direction as 'left' | 'right', playerPosMap);
    updatePositionsInRow(turn.shiftIndex, turn.direction as 'left' | 'right', tokenPosMap);
  } else {
    pushedTile = shiftColumn(newBoard, turn.shiftIndex, turn.direction as 'up' | 'down', turn.tileToInsert);
    updatePositionsInColumn(turn.shiftIndex, turn.direction as 'up' | 'down', playerPosMap);
    updatePositionsInColumn(turn.shiftIndex, turn.direction as 'up' | 'down', tokenPosMap);
  }

  // Write positions back from maps
  for (let i = 0; i < numPlayers; i++) {
    newPlayerPos[i] = playerPosMap[i.toString()];
  }
  for (let id = 0; id <= 20; id++) {
    if (tokenPosMap[id.toString()]) {
      newTokenPos[id] = tokenPosMap[id.toString()];
    }
  }

  // Apply move
  newPlayerPos[currentPlayerIndex] = turn.moveTo;

  // Token collection: find the lowest token ID still on board
  let isFinished = false;
  for (let id = 0; id <= 20; id++) {
    if (newTokenPos[id] !== null) {
      const tokenPos = newTokenPos[id]!;
      if (tokenPos[0] === turn.moveTo[0] && tokenPos[1] === turn.moveTo[1]) {
        newScores[currentPlayerIndex] += getTokenValue(id);
        newTokenPos[id] = null;
        if (newTokenPos.every(p => p === null)) {
          isFinished = true;
        }
      }
      break; // Only check lowest token ID
    }
  }

  const nextPlayerIndex = (currentPlayerIndex + 1) % numPlayers;

  return {
    board: newBoard,
    tileInPlay: pushedTile,
    playerPositions: newPlayerPos,
    tokenPositions: newTokenPos,
    collectedScores: newScores,
    currentPlayerIndex: nextPlayerIndex,
    numPlayers,
    lastShift: { shiftType: turn.shiftType, shiftIndex: turn.shiftIndex, direction: turn.direction },
    isFinished,
  };
}

// ── Evaluation ────────────────────────────────────────────────────────────────

// 300 > max possible opponentTotal (~231 for 3 opponents), so bot score always dominates.
function evaluate(state: BotState, botPlayerIndex: number): number {
  const botScore = state.collectedScores[botPlayerIndex];
  let opponentTotal = 0;
  for (let i = 0; i < state.numPlayers; i++) {
    if (i !== botPlayerIndex) opponentTotal += state.collectedScores[i];
  }
  return botScore * 300 - opponentTotal;
}

function isSameTurn(t1: BotTurn, t2: BotTurn): boolean {
  return t1.shiftType === t2.shiftType &&
    t1.shiftIndex === t2.shiftIndex &&
    t1.direction === t2.direction &&
    t1.tileToInsert === t2.tileToInsert &&
    t1.moveTo[0] === t2.moveTo[0] &&
    t1.moveTo[1] === t2.moveTo[1];
}

// ── Minimax with alpha-beta + transposition table ─────────────────────────────

// Returns null on timeout.
function minimaxInner(
  state: BotState,
  key: string,
  depth: number,
  alpha: number,
  beta: number,
  botPlayerIndex: number,
  deadline: number
): number | null {
  if (Date.now() >= deadline) return null;
  if (state.isFinished || depth === 0) return evaluate(state, botPlayerIndex);

  const ttKey = key + ':' + depth;
  const ttEntry = transpositionTable.get(ttKey);
  if (ttEntry) {
    if (ttEntry.flag === 'EXACT') return ttEntry.score;
    if (ttEntry.flag === 'LOWER') alpha = Math.max(alpha, ttEntry.score);
    if (ttEntry.flag === 'UPPER') beta = Math.min(beta, ttEntry.score);
    if (alpha >= beta) return ttEntry.score;
  }

  const isMax = state.currentPlayerIndex === botPlayerIndex;

  let turns = turnsCache.get(key);
  if (!turns) {
    turns = generateTurns(state);
    turnsCache.set(key, turns);
  }

  // PV move ordering: try cached best move first
  const pvTurn = ttEntry?.bestTurn;
  if (pvTurn) {
    turns = [pvTurn, ...turns.filter(t => !isSameTurn(t, pvTurn))];
  }

  let value = isMax ? -Infinity : Infinity;
  let bestTurnHere: BotTurn | null = null;
  const origAlpha = alpha;

  for (const turn of turns) {
    if (Date.now() >= deadline) return null;

    // Check child TT BEFORE calling applyTurn to potentially skip it entirely
    const childTTKey = turn.resultingStateKey + ':' + (depth - 1);
    const childTT = transpositionTable.get(childTTKey);
    let childVal: number | null;

    if (childTT?.flag === 'EXACT') {
      childVal = childTT.score;
    } else {
      let childAlpha = alpha, childBeta = beta;
      if (childTT?.flag === 'LOWER') childAlpha = Math.max(childAlpha, childTT.score);
      if (childTT?.flag === 'UPPER') childBeta = Math.min(childBeta, childTT.score);
      const nextState = applyTurn(state, turn);
      childVal = minimaxInner(nextState, turn.resultingStateKey, depth - 1,
        childAlpha, childBeta, botPlayerIndex, deadline);
    }

    if (childVal === null) return null;

    if (isMax) {
      if (childVal > value) { value = childVal; bestTurnHere = turn; }
      alpha = Math.max(alpha, value);
    } else {
      if (childVal < value) { value = childVal; bestTurnHere = turn; }
      beta = Math.min(beta, value);
    }
    if (alpha >= beta) break;
  }

  const flag: 'EXACT' | 'LOWER' | 'UPPER' =
    value <= origAlpha ? 'UPPER' : (value >= beta ? 'LOWER' : 'EXACT');
  transpositionTable.set(ttKey, { score: value, flag, bestTurn: bestTurnHere });
  return value;
}

// Root search: same logic but always maximizing and tracks best turn
function minimaxRoot(
  state: BotState,
  rootKey: string,
  depth: number,
  botPlayerIndex: number,
  deadline: number,
  rootTurns: BotTurn[]
): { bestTurn: BotTurn; timedOut: boolean } {
  let bestTurn = rootTurns[0];
  let bestScore = -Infinity;
  let currentAlpha = -Infinity;

  // PV ordering at root
  const ttKey = rootKey + ':' + depth;
  const ttEntry = transpositionTable.get(ttKey);
  const pvTurn = ttEntry?.bestTurn;
  let turns = rootTurns;
  if (pvTurn) {
    turns = [pvTurn, ...rootTurns.filter(t => !isSameTurn(t, pvTurn))];
  }

  for (const turn of turns) {
    if (Date.now() >= deadline) {
      return { bestTurn, timedOut: true };
    }

    const childTTKey = turn.resultingStateKey + ':' + (depth - 1);
    const childTT = transpositionTable.get(childTTKey);
    let childVal: number | null;

    if (childTT?.flag === 'EXACT') {
      childVal = childTT.score;
    } else {
      let childAlpha = currentAlpha, childBeta = Infinity;
      if (childTT?.flag === 'LOWER') childAlpha = Math.max(childAlpha, childTT.score);
      if (childTT?.flag === 'UPPER') childBeta = Math.min(childBeta, childTT.score);
      const nextState = applyTurn(state, turn);
      childVal = minimaxInner(nextState, turn.resultingStateKey, depth - 1,
        childAlpha, childBeta, botPlayerIndex, deadline);
    }

    if (childVal === null) {
      return { bestTurn, timedOut: true };
    }

    if (childVal > bestScore) {
      bestScore = childVal;
      bestTurn = turn;
    }
    currentAlpha = Math.max(currentAlpha, bestScore);
  }

  transpositionTable.set(ttKey, { score: bestScore, flag: 'EXACT', bestTurn });
  return { bestTurn, timedOut: false };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getBestMoves(game: Game, botColor: PlayerColor, timeLimitMs = 5000): BotTurn {
  const botPlayerIndex = game.players.findIndex(p => p.color === botColor);
  const state = gameToBotState(game);
  const deadline = Date.now() + timeLimitMs;

  transpositionTable.clear();
  turnsCache.clear();

  const rootKey = stateKey(state);
  const rootTurns = generateTurns(state);
  turnsCache.set(rootKey, rootTurns);
  let bestTurn = rootTurns[0]; // fallback

  for (let depth = 1; Date.now() < deadline; depth++) {
    const result = minimaxRoot(state, rootKey, depth, botPlayerIndex, deadline, rootTurns);
    if (result.timedOut) break;
    bestTurn = result.bestTurn;
  }

  return bestTurn;
}
