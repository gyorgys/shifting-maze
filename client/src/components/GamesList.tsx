import { useState, useEffect } from 'react';
import { listGames, updatePlayerColor, getGame, startGame } from '../services/api';
import { Game, PlayerColor } from '../types/Game';
import { User } from '../types/User';

interface GamesListProps {
  user: User;
  refresh: number;
  onViewGame?: (gameCode: string) => void;
}

export function GamesList({ user, refresh, onViewGame }: GamesListProps) {
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

  const isGameCreator = (game: Game): boolean => {
    return game.createdBy === user.username && game.stage === 'unstarted';
  };

  const hasEnoughPlayers = (game: Game): boolean => {
    return game.players.length >= 2;
  };

  useEffect(() => {
    fetchGames();
  }, [user.username, refresh]);

  if (loading) {
    return <div className="p-20">Loading games...</div>;
  }

  if (error) {
    return (
      <div className="p-20">
        <div className="text-error mb-10">Error: {error}</div>
        <button
          onClick={fetchGames}
          className="btn btn-sm btn-secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-20">
        <p>No games yet. Create or join a game to get started!</p>
      </div>
    );
  }

  return (
    <div className="p-20">
      <div className="flex justify-between items-center mb-15">
        <h3 className="subtitle m-0">Your Games</h3>
        <button
          onClick={fetchGames}
          className="btn btn-sm btn-secondary"
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
              className="card mb-10"
            >
              <div className="header1 mb-5">
                {game.name}
              </div>
              <div className="text-supporting color-muted mb-10">
                Code: <strong>{game.code}</strong> • {game.userCount} player{game.userCount !== 1 ? 's' : ''} • Stage: <strong>{game.stage}</strong>
              </div>

              {/* Show current turn info if game is playing */}
              {game.currentTurn && (
                <div className="text-normal color-success mb-10">
                  Current turn: <strong>{game.currentTurn.username}</strong> ({game.currentTurn.color}) - {game.currentTurn.phase} phase
                </div>
              )}

              {/* Show color selector for unstarted games where user is a player */}
              {canChangeColor && (
                <div className="mt-10">
                  <label className="text-normal mr-8">
                    Your color:
                  </label>
                  <select
                    value={currentColor}
                    onChange={(e) => handleColorChange(game.code, e.target.value as PlayerColor)}
                    onFocus={() => handleDropdownFocus(game.code)}
                    disabled={updatingColor === game.code}
                    className={updatingColor === game.code ? 'input cursor-wait' : 'input'}
                  >
                    <option value={currentColor}>{currentColor}</option>
                    {availableColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  {updatingColor === game.code && (
                    <span className="text-supporting color-muted" style={{ marginLeft: '8px' }}>
                      Updating...
                    </span>
                  )}
                </div>
              )}

              {/* Show players list */}
              {game.players.length > 0 && (
                <div className="mt-10 text-normal">
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

              {/* Show Start Game button for creator of unstarted games */}
              {isGameCreator(game) && (
                <div className="mt-15">
                  <button
                    onClick={() => handleStartGame(game.code)}
                    disabled={startingGame === game.code || !hasEnoughPlayers(game)}
                    className="btn btn-md btn-success"
                  >
                    {startingGame === game.code ? 'Starting...' : 'Start Game'}
                  </button>
                  {!hasEnoughPlayers(game) ? (
                    <span className="text-normal color-danger" style={{ marginLeft: '10px' }}>
                      Need at least 2 players to start
                    </span>
                  ) : game.players.length < 4 && (
                    <span className="text-supporting color-muted" style={{ marginLeft: '10px' }}>
                      (Waiting for more players is optional)
                    </span>
                  )}
                </div>
              )}

              {/* Show View Game button for playing/finished games */}
              {game.stage !== 'unstarted' && onViewGame && (
                <div className="mt-15">
                  <button
                    onClick={() => onViewGame(game.code)}
                    className="btn btn-md btn-primary"
                  >
                    View Game
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
