import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { CreateUserForm } from './components/CreateUserForm';
import { LoginForm } from './components/LoginForm';
import { GamesList } from './components/GamesList';
import { CreateGameForm } from './components/CreateGameForm';
import { JoinGameForm } from './components/JoinGameForm';

function App() {
  const { user, loading, login, logout } = useAuth();
  const [view, setView] = useState<'login' | 'create'>('login');
  const [refreshGames, setRefreshGames] = useState(0);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Shifting Maze</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - show login/create user
  if (!user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Shifting Maze</h1>

        {view === 'login' ? (
          <>
            <h2>Login</h2>
            <LoginForm onSuccess={login} />
            <p style={{ marginTop: '20px' }}>
              Don't have an account?{' '}
              <button
                onClick={() => setView('create')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Create one
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Create Account</h2>
            <CreateUserForm onSuccess={login} />
            <p style={{ marginTop: '20px' }}>
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Login
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  // Authenticated - show games
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Shifting Maze</h1>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      <p>Welcome, <strong>{user.displayName}</strong>!</p>

      <hr style={{ margin: '20px 0' }} />

      <h2>Create New Game</h2>
      <CreateGameForm
        username={user.username}
        onSuccess={(code, name) => {
          alert(`Game created! Code: ${code}\nName: ${name}`);
          setRefreshGames(prev => prev + 1);
        }}
      />

      <hr style={{ margin: '20px 0' }} />

      <h2>Join Game</h2>
      <JoinGameForm
        username={user.username}
        onSuccess={() => {
          setRefreshGames(prev => prev + 1);
        }}
      />

      <hr style={{ margin: '20px 0' }} />

      <GamesList username={user.username} refresh={refreshGames} />
    </div>
  );
}

export default App;
