import { useState, useEffect } from 'react';
import { getGameDetails } from '../services/api';
import { Game } from '../types/Game';
import { User } from '../types/User';
import { GameBoard, TILE_SIZE } from './GameBoard';
import { Tile } from './Tile';

interface GamePageProps {
  gameCode: string;
  user: User;
}

export function GamePage({ gameCode, user }: GamePageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const gameData = await getGameDetails(gameCode, user.token);
        setGame(gameData);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameCode, user.token]);

  if (loading) {
    return <p>Loading game...</p>;
  }

  if (error) {
    return <div className="text-error">Error: {error}</div>;
  }

  if (!game) {
    return <p>Game not found</p>;
  }

  // Controls are only enabled during shift phase for the current player
  const controlsEnabled = game.currentTurn?.username === user.username && game.currentTurn?.phase === 'shift';

  return (
    <div className="grid-game-page">
      {/* Info Panel */}
      <div className="card self-start">
        <div className="mb-10">
          <strong>Stage:</strong> {game.stage}
        </div>


        {/* Players list */}
        <div>
          <strong>Players:</strong>
          <ul style={{ margin: '5px 0 0 0', padding: '0 0 0 20px' }}>
            {game.players.map(player => {
              const isCurrentPlayer = game.currentTurn?.username === player.username;
              return (
                <li key={player.username}>
                  <span
                    className="player-indicator"
                    style={{ backgroundColor: player.color }}
                  ></span>
                  <span style={{ fontWeight: isCurrentPlayer ? 'bold' : 'normal' }}>
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
      </div>

      {/* Game Board */}
      {game.board && game.tileInPlay !== undefined && game.playerPositions && game.tokenPositions ? (
        <GameBoard
          board={game.board}
          playerPositions={game.playerPositions}
          tokenPositions={game.tokenPositions}
          controlsEnabled={controlsEnabled}
        />
      ) : (
        <div className="card p-20">
          <p>Game board not available (game may not have started yet)</p>
        </div>
      )}

      {/* Tile in Play */}
      {game.tileInPlay !== undefined && (
        <div className="self-start">
          <div className="header2 mb-10">
            Tile in Play:
          </div>
          <svg viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`} className="svg-tile-in-play">
            <Tile
              tile={game.tileInPlay}
              x={0}
              y={0}
              size={TILE_SIZE}
            />
          </svg>

          {/* Rotation controls */}
          <div className="flex gap-8 mt-10 justify-center">
            <button
              onClick={() => console.log('Rotate CW')}
              disabled={!controlsEnabled}
              className="btn btn-icon btn-info"
              title="Rotate Clockwise"
            >
              ↻
            </button>
            <button
              onClick={() => console.log('Rotate CCW')}
              disabled={!controlsEnabled}
              className="btn btn-icon btn-info"
              title="Rotate Counter-Clockwise"
            >
              ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
