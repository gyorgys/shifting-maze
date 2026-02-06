import { useState, FormEvent } from 'react';
import { joinGame } from '../services/api';

interface JoinGameFormProps {
  username: string;
  onSuccess: () => void;
}

export function JoinGameForm({ username, onSuccess }: JoinGameFormProps) {
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
      await joinGame({ code: upperCode }, username);
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
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="gameCode" style={{ display: 'block', marginBottom: '5px' }}>
          Game Code:
        </label>
        <input
          id="gameCode"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ width: '100%', padding: '8px', fontSize: '14px', textTransform: 'uppercase' }}
          disabled={submitting}
          placeholder="ABCD"
          maxLength={4}
          required
        />
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: '15px', fontSize: '14px' }}>{success}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: submitting ? '#ccc' : '#17a2b8',
          color: 'white',
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Joining...' : 'Join Game'}
      </button>
    </form>
  );
}
