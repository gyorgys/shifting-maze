import { useState, useEffect } from 'react';
import { listGames } from '../services/api';
import { Game } from '../types/Game';
import { User } from '../types/User';

interface GameHistoryPageProps {
  user: User;
}

export function GameHistoryPage({ user }: GameHistoryPageProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listGames(user.token, true);
        // Sort most recent first
        data.sort((a, b) => {
          const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
          const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
          return bTime - aTime;
        });
        setGames(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.token]);

  if (loading) {
    return <div className="p-20">Loading history...</div>;
  }

  if (error) {
    return <div className="p-20 text-error">Error: {error}</div>;
  }

  if (games.length === 0) {
    return <div className="p-20">No finished games yet.</div>;
  }

  return (
    <div className="p-20" data-testid="game-history-list">
      <ul className="list-unstyled">
        {games.map(game => {
          const scores = game.scores ?? {};
          const sortedPlayers = [...game.players].sort(
            (a, b) => (scores[b.color] ?? 0) - (scores[a.color] ?? 0)
          );
          const finishedLabel = game.finishedAt
            ? new Date(game.finishedAt).toLocaleString()
            : '—';

          return (
            <li key={game.code} className="card mb-10">
              <div className="flex items-baseline gap-10 mb-5">
                <span className="header1">{game.name}</span>
                <span className="text-supporting color-muted">{finishedLabel}</span>
              </div>
              <div className="flex gap-15 text-normal flex-wrap">
                {sortedPlayers.map((player, index) => (
                  <span key={player.color} className="flex items-center gap-15">
                    {index > 0 && <span className="color-muted">·</span>}
                    {index === 0
                      ? <strong>{player.username} ({player.color}): {scores[player.color] ?? 0}</strong>
                      : <>{player.username} ({player.color}): {scores[player.color] ?? 0}</>
                    }
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
