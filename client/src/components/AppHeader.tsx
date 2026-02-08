import { ReactNode } from 'react';

interface AppHeaderProps {
  content?: ReactNode;
  username?: string;
  onLogout?: () => void;
}

export function AppHeader({ content, username, onLogout }: AppHeaderProps) {
  return (
    <header className="grid-header border border-bottom-only py-12 px-20 mb-20 whitespace-nowrap">
      {/* Left: App title */}
      <h1 className="title">
        Shifting Maze
      </h1>

      {/* Center: View-specific content */}
      <div className="text-center">
        {content}
      </div>

      {/* Right: User info + logout */}
      <div className="flex items-center gap-12 justify-end">
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
