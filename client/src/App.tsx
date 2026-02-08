import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { CreateUserForm } from './components/CreateUserForm';
import { LoginForm } from './components/LoginForm';
import { GamesList } from './components/GamesList';
import { CreateGameForm } from './components/CreateGameForm';
import { JoinGameForm } from './components/JoinGameForm';
import { GamePage } from './components/GamePage';
import { AppHeader } from './components/AppHeader';

type AuthView = 'login' | 'create';

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <AppHeader />
        <p style={{ padding: '0 20px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <Routes>
        <Route path="/" element={
          user ? (
            <HomePage user={user} logout={logout} />
          ) : (
            <AuthPage login={login} />
          )
        } />
        <Route path="/game/:code" element={
          user ? (
            <GameDetailPageWrapper user={user} logout={logout} />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </div>
  );
}

// Auth page component (login/create account)
function AuthPage({ login }: { login: (user: any) => void }) {
  const [authView, setAuthView] = useState<AuthView>('login');

  return (
    <>
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
    </>
  );
}

// Home page component (games list)
function HomePage({ user, logout }: { user: any; logout: () => void }) {
  const [refreshGames, setRefreshGames] = useState(0);
  const navigate = useNavigate();

  const navigateToGame = (gameCode: string) => {
    navigate(`/game/${gameCode}`);
  };

  const headerContent = (
    <h2 style={{ margin: 0, fontSize: '18px' }}>Games</h2>
  );

  return (
    <>
      <AppHeader
        content={headerContent}
        username={user.displayName}
        onLogout={logout}
      />
      <div style={{ padding: '0 20px' }}>
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
      </div>
    </>
  );
}

// Game detail page wrapper (extracts route params)
function GameDetailPageWrapper({ user, logout }: { user: any; logout: () => void }) {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  if (!code) {
    return <Navigate to="/" replace />;
  }

  const navigateToGames = () => {
    navigate('/');
  };

  // We'll need to fetch the game name for the header, but for now just show the code
  const headerContent = (
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
        <h2 style={{ margin: 0, fontSize: '18px' }}>Game</h2>
        <span style={{ fontSize: '12px', color: '#6c757d' }}>{code}</span>
      </div>
    </div>
  );

  return (
    <>
      <AppHeader
        content={headerContent}
        username={user.displayName}
        onLogout={logout}
      />
      <div style={{ padding: '0 20px' }}>
        <GamePage gameCode={code} user={user} />
      </div>
    </>
  );
}

export default App;
