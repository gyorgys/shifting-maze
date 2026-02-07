import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { CreateUserForm } from './components/CreateUserForm';
import { LoginForm } from './components/LoginForm';
import { GamesList } from './components/GamesList';
import { CreateGameForm } from './components/CreateGameForm';
import { JoinGameForm } from './components/JoinGameForm';
import { GamePage } from './components/GamePage';
import { AppHeader } from './components/AppHeader';

type AuthView = 'login' | 'create';
type MainView = 'games' | 'game-detail';

function App() {
  const { user, loading, login, logout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [mainView, setMainView] = useState<MainView>('games');
  const [selectedGameCode, setSelectedGameCode] = useState<string | null>(null);
  const [selectedGameName, setSelectedGameName] = useState<string | null>(null);
  const [refreshGames, setRefreshGames] = useState(0);

  // Navigation helpers
  const navigateToGame = (gameCode: string, gameName: string) => {
    setSelectedGameCode(gameCode);
    setSelectedGameName(gameName);
    setMainView('game-detail');
  };

  const navigateToGames = () => {
    setSelectedGameCode(null);
    setSelectedGameName(null);
    setMainView('games');
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <AppHeader />
        <p style={{ padding: '0 20px' }}>Loading...</p>
      </div>
    );
  }

  // Not authenticated - show login/create user
  if (!user) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <AppHeader />

        <div style={{ padding: '0 20px' }}>
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
      </div>
    );
  }

  // Header center content based on current view
  const headerContent = mainView === 'games' ? (
    <h2 style={{ margin: 0, fontSize: '18px' }}>Games</h2>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={navigateToGames}
        title="Back to Games"
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '2px 6px',
          lineHeight: 1,
        }}
      >
        ←
      </button>
      <div>
        <h2 style={{ margin: 0, fontSize: '18px' }}>{selectedGameName}</h2>
        <span style={{ fontSize: '12px', color: '#6c757d' }}>{selectedGameCode}</span>
      </div>
    </div>
  );

  // Authenticated - show games list or game detail
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <AppHeader
        content={headerContent}
        username={user.displayName}
        onLogout={logout}
      />

      <div style={{ padding: '0 20px' }}>
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
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;
