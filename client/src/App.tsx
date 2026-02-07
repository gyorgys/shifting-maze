import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { CreateUserForm } from './components/CreateUserForm';
import { LoginForm } from './components/LoginForm';
import { GamesList } from './components/GamesList';
import { CreateGameForm } from './components/CreateGameForm';
import { JoinGameForm } from './components/JoinGameForm';
import { GamePage } from './components/GamePage';

type AuthView = 'login' | 'create';
type MainView = 'games' | 'game-detail';

function App() {
  const { user, loading, login, logout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [mainView, setMainView] = useState<MainView>('games');
  const [selectedGameCode, setSelectedGameCode] = useState<string | null>(null);
  const [refreshGames, setRefreshGames] = useState(0);

  // Navigation helpers
  const navigateToGame = (gameCode: string) => {
    setSelectedGameCode(gameCode);
    setMainView('game-detail');
  };

  const navigateToGames = () => {
    setSelectedGameCode(null);
    setMainView('games');
  };

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

        {authView === 'login' ? (
          <>
            <h2>Login</h2>
            <LoginForm onSuccess={login} />
            <p style={{ marginTop: '20px' }}>
              Don't have an account?{' '}
              <button
                onClick={() => setAuthView('create')}
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
                onClick={() => setAuthView('login')}
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

  // Authenticated - show games list or game detail
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

      {mainView === 'games' ? (
        <>
          <h2>Create New Game</h2>
          <CreateGameForm
            user={user}
            onSuccess={(code, name) => {
              alert(`Game created! Code: ${code}\nName: ${name}`);
              setRefreshGames(prev => prev + 1);
            }}
          />

          <hr style={{ margin: '20px 0' }} />

          <h2>Join Game</h2>
          <JoinGameForm
            user={user}
            onSuccess={() => {
              setRefreshGames(prev => prev + 1);
            }}
          />

          <hr style={{ margin: '20px 0' }} />

          <GamesList
            user={user}
            refresh={refreshGames}
            onViewGame={navigateToGame}
          />
        </>
      ) : (
        selectedGameCode && (
          <GamePage
            gameCode={selectedGameCode}
            user={user}
            onBack={navigateToGames}
          />
        )
      )}
    </div>
  );
}

export default App;
