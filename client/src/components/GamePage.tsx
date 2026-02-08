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
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!game) {
    return <p>Game not found</p>;
  }

  // Controls are only enabled during shift phase for the current player
  const controlsEnabled = game.currentTurn?.username === user.username && game.currentTurn?.phase === 'shift';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto', gap: '20px' }}>
      {/* Info Panel */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          alignSelf: 'start',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
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
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: player.color,
                      border: '1px solid black',
                      marginRight: '8px',
                    }}
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
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <p>Game board not available (game may not have started yet)</p>
        </div>
      )}

      {/* Tile in Play */}
      {game.tileInPlay !== undefined && (
        <div style={{ alignSelf: 'start' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            Tile in Play:
          </div>
          <svg viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`} style={{ border: '1px solid #000', height: 'calc(75vh / 7)', width: 'auto', display: 'block', margin: '0 auto' }}>
            <Tile
              tile={game.tileInPlay}
              x={0}
              y={0}
              size={TILE_SIZE}
            />
          </svg>

          {/* Rotation controls */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => console.log('Rotate CW')}
              disabled={!controlsEnabled}
              style={{
                padding: '12px 16px',
                fontSize: '28px',
                backgroundColor: controlsEnabled ? '#17a2b8' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: controlsEnabled ? 'pointer' : 'not-allowed',
                lineHeight: 1,
              }}
              title="Rotate Clockwise"
            >
              ↻
            </button>
            <button
              onClick={() => console.log('Rotate CCW')}
              disabled={!controlsEnabled}
              style={{
                padding: '12px 16px',
                fontSize: '28px',
                backgroundColor: controlsEnabled ? '#17a2b8' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: controlsEnabled ? 'pointer' : 'not-allowed',
                lineHeight: 1,
              }}
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
