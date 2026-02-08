import { useState, FormEvent } from 'react';
import { joinGame } from '../services/api';
import { User } from '../types/User';

interface JoinGameFormProps {
  user: User;
  onSuccess: () => void;
}

export function JoinGameForm({ user, onSuccess }: JoinGameFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const upperCode = code.toUpperCase();
    if (!/^[A-Z]{4}$/.test(upperCode)) {
      setError('Game code must be exactly 4 letters');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await joinGame({ code: upperCode }, user.token);
      setSuccess(`Successfully joined game ${upperCode}!`);
      setCode('');
      onSuccess();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label htmlFor="gameCode" className="label">
          Game Code:
        </label>
        <input
          id="gameCode"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="input uppercase"
          disabled={submitting}
          placeholder="ABCD"
          maxLength={4}
          required
        />
      </div>

      {error && (
        <div className="text-error mb-15">{error}</div>
      )}

      {success && (
        <div className="text-success mb-15">{success}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-md btn-info"
      >
        {submitting ? 'Joining...' : 'Join Game'}
      </button>
    </form>
  );
}
