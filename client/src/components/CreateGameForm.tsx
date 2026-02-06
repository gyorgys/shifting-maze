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
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="gameName" style={{ display: 'block', marginBottom: '5px' }}>
          Game Name:
        </label>
        <input
          id="gameName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          disabled={submitting}
          placeholder="Enter game name"
          required
        />
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: submitting ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}
