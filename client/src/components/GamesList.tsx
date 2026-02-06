import { useState, useEffect } from 'react';
import { listGames } from '../services/api';
import { Game } from '../types/Game';

interface GamesListProps {
  username: string;
  refresh: number;
}

export function GamesList({ username, refresh }: GamesListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGames(username);
      setGames(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [username, refresh]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading games...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>
        <button
          onClick={fetchGames}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <p>No games yet. Create or join a game to get started!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Your Games</h3>
        <button
          onClick={fetchGames}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {games.map((game) => (
          <li
            key={game.code}
            style={{
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
              {game.name}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Code: <strong>{game.code}</strong> • {game.userCount} player{game.userCount !== 1 ? 's' : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
