import { useState, useEffect } from 'react';
import { listGames, updatePlayerColor, getGame, startGame } from '../services/api';
import { Game, PlayerColor } from '../types/Game';
import { User } from '../types/User';

interface GamesListProps {
  user: User;
  refresh: number;
}

export function GamesList({ user, refresh }: GamesListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingColor, setUpdatingColor] = useState<string | null>(null);
  const [startingGame, setStartingGame] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGames(user.token);
      setGames(data);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = async (gameCode: string, newColor: PlayerColor) => {
    setUpdatingColor(gameCode);
    try {
      await updatePlayerColor(gameCode, user.token, newColor);
      // Refresh games list to show updated color
      await fetchGames();
    } catch (error) {
      alert(`Failed to update color: ${(error as Error).message}`);
    } finally {
      setUpdatingColor(null);
    }
  };

  const handleDropdownFocus = async (gameCode: string) => {
    // Refresh game data when dropdown is opened to get latest available colors
    try {
      const updatedGame = await getGame(gameCode, user.token);
      setGames(prevGames =>
        prevGames.map(g => g.code === gameCode ? updatedGame : g)
      );
    } catch (error) {
      console.error('Failed to refresh game:', error);
    }
  };

  const handleStartGame = async (gameCode: string) => {
    setStartingGame(gameCode);
    try {
      await startGame(gameCode, user.token);
      // Refresh games list to show updated game state
      await fetchGames();
    } catch (error) {
      alert(`Failed to start game: ${(error as Error).message}`);
    } finally {
      setStartingGame(null);
    }
  };

  const getCurrentPlayerColor = (game: Game): PlayerColor | null => {
    const player = game.players.find(p => p.username === user.username);
    return player ? player.color : null;
  };

  const canStartGame = (game: Game): boolean => {
    return game.createdBy === user.username &&
           game.stage === 'unstarted' &&
           game.players.length >= 2;
  };

  useEffect(() => {
    fetchGames();
  }, [user.username, refresh]);

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
        {games.map((game) => {
          const currentColor = getCurrentPlayerColor(game);
          const canChangeColor = game.stage === 'unstarted' && currentColor;
          const availableColors = game.availableColors || [];

          return (
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
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
                Code: <strong>{game.code}</strong> • {game.userCount} player{game.userCount !== 1 ? 's' : ''} • Stage: <strong>{game.stage}</strong>
              </div>

              {/* Show current turn info if game is playing */}
              {game.currentTurn && (
                <div style={{ fontSize: '14px', color: '#28a745', marginBottom: '8px' }}>
                  Current turn: <strong>{game.currentTurn.username}</strong> ({game.currentTurn.color}) - {game.currentTurn.phase} phase
                </div>
              )}

              {/* Show color selector for unstarted games where user is a player */}
              {canChangeColor && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '14px', marginRight: '8px' }}>
                    Your color:
                  </label>
                  <select
                    value={currentColor}
                    onChange={(e) => handleColorChange(game.code, e.target.value as PlayerColor)}
                    onFocus={() => handleDropdownFocus(game.code)}
                    disabled={updatingColor === game.code}
                    style={{
                      padding: '6px 10px',
                      fontSize: '14px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: updatingColor === game.code ? 'wait' : 'pointer',
                    }}
                  >
                    <option value={currentColor}>{currentColor}</option>
                    {availableColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  {updatingColor === game.code && (
                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6c757d' }}>
                      Updating...
                    </span>
                  )}
                </div>
              )}

              {/* Show players list */}
              {game.players.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <strong>Players:</strong>
                  <ul style={{ margin: '5px 0 0 0', padding: '0 0 0 20px' }}>
                    {game.players.map(player => (
                      <li key={player.username}>
                        {player.username} ({player.color})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show Start Game button for creator of unstarted games with 2+ players */}
              {canStartGame(game) && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => handleStartGame(game.code)}
                    disabled={startingGame === game.code}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      backgroundColor: startingGame === game.code ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: startingGame === game.code ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {startingGame === game.code ? 'Starting...' : 'Start Game'}
                  </button>
                  {game.players.length < 4 && (
                    <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6c757d' }}>
                      (Waiting for more players is optional)
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
