import { useState, FormEvent } from 'react';
import { createGame } from '../services/api';
import { User } from '../types/User';

interface CreateGameFormProps {
  user: User;
  onSuccess: (code: string, name: string) => void;
}

export function CreateGameForm({ user, onSuccess }: CreateGameFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (name.length < 1 || name.length > 100) {
      setError('Game name must be 1-100 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const game = await createGame({ name }, user.token);
      setName('');
      onSuccess(game.code, game.name);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container" data-testid="create-game-form">
      <div className="form-group">
        <label htmlFor="gameName" className="label">
          Game Name:
        </label>
        <input
          id="gameName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          disabled={submitting}
          placeholder="Enter game name"
          required
          data-testid="create-game-name-input"
        />
      </div>

      {error && (
        <div className="text-error mb-15" data-testid="create-game-error">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-md btn-success"
        data-testid="create-game-submit-button"
      >
        {submitting ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}
