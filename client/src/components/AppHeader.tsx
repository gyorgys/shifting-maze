import { ReactNode } from 'react';

interface AppHeaderProps {
  content?: ReactNode;
  username?: string;
  onLogout?: () => void;
}

export function AppHeader({ content, username, onLogout }: AppHeaderProps) {
  return (
    <header className="grid-header border mb-20" style={{ padding: '12px 20px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', whiteSpace: 'nowrap' }}>
      {/* Left: App title */}
      <h1 className="title" style={{ whiteSpace: 'nowrap' }}>
        Shifting Maze
      </h1>

      {/* Center: View-specific content */}
      <div className="text-center">
        {content}
      </div>

      {/* Right: User info + logout */}
      <div className="flex items-center gap-12 justify-end" style={{ whiteSpace: 'nowrap' }}>
        {username && onLogout && (
          <>
            <span className="text-normal">{username}</span>
            <button
              onClick={onLogout}
              className="btn btn-sm btn-danger"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
