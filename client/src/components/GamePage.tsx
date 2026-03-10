import { useState, useEffect } from 'react';
import { getGameDetails, performShift, performMove, resignGame, pollGameState, ShiftRequest } from '../services/api';
import { Game, Tile as TileType, TokenId } from '../types/Game';
import { User } from '../types/User';
import { GameBoard } from './GameBoard';
import { TileInPlay } from './TileInPlay';
import { CollectedTokens } from './CollectedTokens';

function getScore(tokenIds: TokenId[]): number {
  return tokenIds.reduce((sum, id) => sum + (id <= 19 ? id + 1 : 25), 0);
}

interface GamePageProps {
  gameCode: string;
  user: User;
  onGameLoaded?: (gameName: string) => void;
}

export function GamePage({ gameCode, user, onGameLoaded }: GamePageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Local state for rotated tile (updated by TileInPlay component after rotation)
  const [rotatedTile, setRotatedTile] = useState<TileType | null>(null);
  const [isShifting, setIsShifting] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [confirmingResign, setConfirmingResign] = useState(false);
  const [isResigning, setIsResigning] = useState(false);
  const [resignError, setResignError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const gameData = await getGameDetails(gameCode, user.token);
        setGame(gameData);
        // Initialize rotated tile with the current tile in play
        if (gameData.tileInPlay !== undefined) {
          setRotatedTile(gameData.tileInPlay);
        }
        // Notify parent of game name for header
        if (onGameLoaded) {
          onGameLoaded(gameData.name);
        }
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameCode, user.token, onGameLoaded]);

  // Reset rotated tile when game's tileInPlay changes
  useEffect(() => {
    if (game?.tileInPlay !== undefined) {
      setRotatedTile(game.tileInPlay);
    }
  }, [game?.tileInPlay]);

  // Long-polling loop: keeps game state in sync with other players' actions
  useEffect(() => {
    if (!game || game.stage === 'finished') return;

    const controller = new AbortController();
    let active = true;

    async function poll(version: number) {
      if (!active) return;
      try {
        const result = await pollGameState(gameCode, user.token, version, controller.signal);
        if (!active) return;
        if (result.changed) {
          setGame(result.game);
          if (result.game.tileInPlay !== undefined) setRotatedTile(result.game.tileInPlay);
          // game.version changed → effect re-runs → new poll starts automatically
        } else {
          poll(version); // timeout with no change — poll again
        }
      } catch {
        if (!active) return;
        setTimeout(() => poll(version), 3000); // retry after network error
      }
    }

    poll(game.version ?? 0);

    return () => {
      active = false;
      controller.abort();
    };
  }, [game?.version, game?.stage, gameCode, user.token]);

  // Re-fetch game state after a failed action to keep UI in sync
  async function resyncGame() {
    try {
      const freshGame = await getGameDetails(gameCode, user.token);
      setGame(freshGame);
      if (freshGame.tileInPlay !== undefined) setRotatedTile(freshGame.tileInPlay);
    } catch { /* keep showing the original action error */ }
  }

  const handleShiftComplete = async (shiftRequest: ShiftRequest) => {
    setIsShifting(true);
    setShiftError(null);
    try {
      const updatedGame = await performShift(gameCode, user.token, shiftRequest);
      setGame(updatedGame);
      setRotatedTile(updatedGame.tileInPlay!);
    } catch (err) {
      setShiftError((err as Error).message);
      await resyncGame();
    } finally {
      setIsShifting(false);
    }
  };

  const handleMoveComplete = async (row: number, col: number) => {
    setIsMoving(true);
    setMoveError(null);
    try {
      const updatedGame = await performMove(gameCode, user.token, { row, col });
      setGame(updatedGame);
      if (updatedGame.tileInPlay !== undefined) setRotatedTile(updatedGame.tileInPlay);
    } catch (err) {
      setMoveError((err as Error).message);
      await resyncGame();
    } finally {
      setIsMoving(false);
    }
  };

  const handleResign = async () => {
    setIsResigning(true);
    setResignError(null);
    try {
      const updatedGame = await resignGame(gameCode, user.token);
      setGame(updatedGame);
    } catch (err) {
      setResignError((err as Error).message);
    } finally {
      setIsResigning(false);
      setConfirmingResign(false);
    }
  };

  if (loading) {
    return <p>Loading game...</p>;
  }

  if (error) {
    return <div className="text-error">Error: {error}</div>;
  }

  if (!game) {
    return <p>Game not found</p>;
  }

  const isMyTurn = game.currentTurn?.username === user.username;

  // Controls are only enabled during shift phase for the current player (and not mid-shift)
  const controlsEnabled = isMyTurn && game.currentTurn?.phase === 'shift' && !isShifting;

  const moveControlsEnabled = isMyTurn && game.currentTurn?.phase === 'move' && !isMoving;

  const myPlayer = game.players.find(p => p.username === user.username);

  const winnerColor: string | null = (() => {
    if (game.stage !== 'finished' || !game.collectedTokens) return null;
    let best = -1, bestColor: string | null = null;
    for (const [color, ids] of Object.entries(game.collectedTokens)) {
      const score = getScore(ids);
      if (score > best) { best = score; bestColor = color; }
    }
    return bestColor;
  })();

  return (
    <div className="grid-game-page" data-testid="game-page">
      {/* Info Panel */}
      <div className="card self-start">
        <div className="mb-10">
          <span className="text-emphasized">Stage:</span> <span data-testid="game-stage">{game.stage}</span>
        </div>


        {/* Players list */}
        <div>
          <span className="text-emphasized">Players:</span>
          <ul className="list-compact" data-testid="game-players-list">
            {game.players.map(player => {
              const isCurrentPlayer = game.currentTurn?.username === player.username;
              return (
                <li key={player.username}>
                  <span
                    className="player-indicator"
                    style={{ backgroundColor: player.color }}
                  ></span>
                  <span className={isCurrentPlayer ? 'text-emphasized' : 'text-normal'}>
                    {player.username} ({player.color})
                    {isCurrentPlayer && game.currentTurn && (
                      <span> - {game.currentTurn.phase}</span>
                    )}
                    {game.stage === 'finished' && winnerColor === player.color && (
                      <span className="text-emphasized"> WINNER!</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Collected tokens */}
        {myPlayer && game.collectedTokens && (
          <div className="mt-10">
            <div className="mb-10">
              <span className="text-emphasized">Your tokens</span>
              {' '}
              <span className="text-normal">
                — {getScore(game.collectedTokens[myPlayer.color] ?? [])} pts
              </span>
            </div>
            <CollectedTokens tokenIds={game.collectedTokens[myPlayer.color] ?? []} />
          </div>
        )}

        {/* Resign button */}
        {game.stage === 'playing' && (
          <div className="mt-10">
            {!confirmingResign ? (
              <button
                className="btn btn-sm btn-danger"
                disabled={isResigning}
                onClick={() => setConfirmingResign(true)}
              >
                Resign
              </button>
            ) : (
              <div>
                <span className="text-normal">Resign and end the game?</span>
                <button
                  className="btn btn-sm btn-danger"
                  disabled={isResigning}
                  onClick={handleResign}
                >
                  Yes, resign
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={isResigning}
                  onClick={() => setConfirmingResign(false)}
                >
                  Cancel
                </button>
              </div>
            )}
            {resignError && (
              <div className="text-error mt-10" data-testid="game-resign-error">
                Resign failed: {resignError}
              </div>
            )}
          </div>
        )}

        {/* Shift error message */}
        {shiftError && (
          <div className="text-error mt-10" data-testid="game-shift-error">Shift failed: {shiftError}</div>
        )}

        {/* Move error message */}
        {moveError && (
          <div className="text-error mt-10" data-testid="game-move-error">Move failed: {moveError}</div>
        )}
      </div>

      {/* Game Board */}
      {game.board && game.tileInPlay !== undefined && game.playerPositions && game.tokenPositions ? (
        <GameBoard
          board={game.board}
          playerPositions={game.playerPositions}
          tokenPositions={game.tokenPositions}
          tileInPlay={rotatedTile !== null ? rotatedTile : game.tileInPlay}
          controlsEnabled={controlsEnabled}
          moveControlsEnabled={moveControlsEnabled}
          currentPlayerColor={game.players.find(p => p.username === user.username)?.color}
          onShiftComplete={handleShiftComplete}
          onMoveComplete={handleMoveComplete}
        />
      ) : (
        <div className="card p-20">
          <p>Game board not available (game may not have started yet)</p>
        </div>
      )}

      {/* Tile in Play */}
      {game.tileInPlay !== undefined && (
        <TileInPlay
          tile={game.tileInPlay}
          controlsEnabled={controlsEnabled}
          onRotationComplete={setRotatedTile}
        />
      )}
    </div>
  );
}
