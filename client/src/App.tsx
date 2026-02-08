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
      <div>
        <AppHeader />
        <p className="px-20">Loading...</p>
      </div>
    );
  }

  return (
    <div>
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
      <div className="px-20">
        {authView === 'login' ? (
          <>
            <h2>Login</h2>
            <LoginForm onSuccess={login} />
            <p className="mt-20">
              Don't have an account?{' '}
              <button
                onClick={() => setAuthView('create')}
                className="btn-link"
              >
                Create one
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Create Account</h2>
            <CreateUserForm onSuccess={login} />
            <p className="mt-20">
              Already have an account?{' '}
              <button
                onClick={() => setAuthView('login')}
                className="btn-link"
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
    <h2 className="subtitle">Games</h2>
  );

  return (
    <>
      <AppHeader
        content={headerContent}
        username={user.displayName}
        onLogout={logout}
      />
      <div className="px-20">
        <h2>Create New Game</h2>
        <CreateGameForm
          user={user}
          onSuccess={(code, name) => {
            alert(`Game created! Code: ${code}\nName: ${name}`);
            setRefreshGames(prev => prev + 1);
          }}
        />

        <hr className="divider" />

        <h2>Join Game</h2>
        <JoinGameForm
          user={user}
          onSuccess={() => {
            setRefreshGames(prev => prev + 1);
          }}
        />

        <hr className="divider" />

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
  const [gameName, setGameName] = useState<string | null>(null);

  if (!code) {
    return <Navigate to="/" replace />;
  }

  const navigateToGames = () => {
    navigate('/');
  };

  const headerContent = (
    <div className="flex items-center gap-10">
      <button
        onClick={navigateToGames}
        title="Back to Games"
        className="btn-link title"
      >
        ←
      </button>
      <div>
        <h2 className="subtitle">{gameName || 'Game'}</h2>
        <span className="text-supporting color-muted">{code}</span>
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
      <div className="px-20">
        <GamePage gameCode={code} user={user} onGameLoaded={setGameName} />
      </div>
    </>
  );
}

export default App;
