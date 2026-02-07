import { ReactNode } from 'react';

interface AppHeaderProps {
  content?: ReactNode;
  username?: string;
  onLogout?: () => void;
}

export function AppHeader({ content, username, onLogout }: AppHeaderProps) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '12px 20px',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '20px',
      }}
    >
      {/* Left: App title */}
      <h1 style={{ margin: 0, fontSize: '20px', whiteSpace: 'nowrap' }}>
        Shifting Maze
      </h1>

      {/* Center: View-specific content */}
      <div style={{ textAlign: 'center' }}>
        {content}
      </div>

      {/* Right: User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
        {username && onLogout && (
          <>
            <span style={{ fontSize: '14px' }}>{username}</span>
            <button
              onClick={onLogout}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
