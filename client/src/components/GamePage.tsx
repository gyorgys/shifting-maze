import { useState, useEffect } from 'react';
import { getGameDetails } from '../services/api';
import { Game } from '../types/Game';
import { User } from '../types/User';
import { GameBoard } from './GameBoard';

interface GamePageProps {
  gameCode: string;
  user: User;
  onBack: () => void;
}

export function GamePage({ gameCode, user, onBack }: GamePageProps) {
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
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Games
        </button>
        <p>Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Games
        </button>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Back to Games
        </button>
        <p>Game not found</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          ← Back to Games
        </button>
        <h2 style={{ margin: '10px 0' }}>{game.name}</h2>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '5px 0' }}>
          Game Code: <strong>{game.code}</strong>
        </p>
      </div>

      {/* Info Panel */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <strong>Stage:</strong> {game.stage}
        </div>

        {/* Current turn info */}
        {game.currentTurn && (
          <div style={{ marginBottom: '10px', color: '#28a745' }}>
            <strong>Current Turn:</strong> {game.currentTurn.username} ({game.currentTurn.color}) - {game.currentTurn.phase} phase
          </div>
        )}

        {/* Players list */}
        <div>
          <strong>Players:</strong>
          <ul style={{ margin: '5px 0 0 0', padding: '0 0 0 20px' }}>
            {game.players.map(player => (
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
                {player.username} ({player.color})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Game Board */}
      {game.board && game.tileInPlay !== undefined && game.playerPositions && game.tokenPositions && game.collectedTokens ? (
        <GameBoard
          board={game.board}
          tileInPlay={game.tileInPlay}
          playerPositions={game.playerPositions}
          tokenPositions={game.tokenPositions}
          collectedTokens={game.collectedTokens}
        />
      ) : (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <p>Game board not available (game may not have started yet)</p>
        </div>
      )}
    </div>
  );
}
