import { useState, useEffect } from 'react';
import { getGameDetails, performShift, ShiftRequest } from '../services/api';
import { Game, Tile as TileType } from '../types/Game';
import { User } from '../types/User';
import { GameBoard } from './GameBoard';
import { TileInPlay } from './TileInPlay';

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

  const handleShiftComplete = async (shiftRequest: ShiftRequest) => {
    setIsShifting(true);
    setShiftError(null);

    try {
      const updatedGame = await performShift(gameCode, user.token, shiftRequest);
      setGame(updatedGame);
      setRotatedTile(updatedGame.tileInPlay!);
    } catch (err) {
      setShiftError((err as Error).message);
      // Re-fetch game state to re-sync
      try {
        const freshGame = await getGameDetails(gameCode, user.token);
        setGame(freshGame);
        if (freshGame.tileInPlay !== undefined) {
          setRotatedTile(freshGame.tileInPlay);
        }
      } catch {
        // If re-fetch also fails, keep showing the error
      }
    } finally {
      setIsShifting(false);
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

  // Controls are only enabled during shift phase for the current player (and not mid-shift)
  const controlsEnabled =
    game.currentTurn?.username === user.username &&
    game.currentTurn?.phase === 'shift' &&
    !isShifting;

  return (
    <div className="grid-game-page">
      {/* Info Panel */}
      <div className="card self-start">
        <div className="mb-10">
          <span className="text-emphasized">Stage:</span> {game.stage}
        </div>


        {/* Players list */}
        <div>
          <span className="text-emphasized">Players:</span>
          <ul className="list-compact">
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
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Shift error message */}
        {shiftError && (
          <div className="text-error mt-10">Shift failed: {shiftError}</div>
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
          onShiftComplete={handleShiftComplete}
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
