import { useState, FormEvent } from 'react';
import { createUser, login } from '../services/api';
import { User } from '../types/User';

interface CreateUserFormProps {
  onSuccess: (user: User) => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = 'Username must be 3-20 alphanumeric characters or underscores';
    }

    // Display name validation
    if (displayName.length < 1 || displayName.length > 50) {
      newErrors.displayName = 'Display name must be 1-50 characters';
    }

    // Password validation
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      // Create user
      await createUser({ username, displayName, password });
      // Automatically log in the user after registration
      const user = await login({ username, password });
      if (user) {
        onSuccess(user);
      } else {
        setErrors({ api: 'Registration successful but login failed. Please try logging in.' });
      }
    } catch (error) {
      setErrors({ api: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
          Username:
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          disabled={submitting}
        />
        {errors.username && <div style={{ color: 'red', fontSize: '12px' }}>{errors.username}</div>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="displayName" style={{ display: 'block', marginBottom: '5px' }}>
          Display Name:
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          disabled={submitting}
        />
        {errors.displayName && (
          <div style={{ color: 'red', fontSize: '12px' }}>{errors.displayName}</div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
          Password:
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          disabled={submitting}
        />
        {errors.password && <div style={{ color: 'red', fontSize: '12px' }}>{errors.password}</div>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
          Confirm Password:
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          disabled={submitting}
        />
        {errors.confirmPassword && (
          <div style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword}</div>
        )}
      </div>

      {errors.api && (
        <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{errors.api}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          backgroundColor: submitting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  );
}
