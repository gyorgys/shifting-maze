import { useState, FormEvent } from 'react';
import { login } from '../services/api';
import { User } from '../types/User';

interface LoginFormProps {
  onSuccess: (user: User) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const user = await login({ username, password });
      if (user) {
        onSuccess(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError((error as Error).message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label htmlFor="username" className="label">
          Username:
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          disabled={submitting}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="label">
          Password:
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          disabled={submitting}
          required
        />
      </div>

      {error && (
        <div className="text-error mb-15">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-md btn-primary"
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
