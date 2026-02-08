# Client Components

This document describes all React components in the Shifting Maze client application.

## Authentication Components

### CreateUserForm

User registration form with validation.

**File:** [client/src/components/CreateUserForm.tsx](../../client/src/components/CreateUserForm.tsx)

**Props:**
```typescript
interface CreateUserFormProps {
  onSuccess: (user: User) => void;  // Called when user is created successfully
}
```

**Features:**
- Input fields: username, displayName, password, confirmPassword
- Client-side validation:
  - Username: 3-20 chars, alphanumeric + underscore only
  - Display name: 1-50 chars
  - Password: Minimum 8 chars
  - Passwords must match
- Real-time error display for each field
- Disabled state while submitting
- Automatic password hashing with generated salt
- Calls `onSuccess` callback with created user

**Validation Rules:**
```typescript
username: /^[a-zA-Z0-9_]{3,20}$/
displayName: 1-50 characters
password: minimum 8 characters
confirmPassword: must match password
```

**Usage:**
```tsx
<CreateUserForm
  onSuccess={(user) => {
    console.log('User created:', user);
    login(user);
  }}
/>
```

---

### LoginForm

User login form with two-step authentication.

**File:** [client/src/components/LoginForm.tsx](../../client/src/components/LoginForm.tsx)

**Props:**
```typescript
interface LoginFormProps {
  onSuccess: (user: User) => void;  // Called when login is successful
}
```

**Features:**
- Input fields: username, password
- Two-step login process:
  1. Fetches user's salt from server
  2. Hashes password with salt
  3. Sends hash to server for validation
- Error message display
- Disabled state while submitting
- Calls `onSuccess` callback with authenticated user

**Usage:**
```tsx
<LoginForm
  onSuccess={(user) => {
    console.log('Logged in:', user);
    login(user);
  }}
/>
```

---

## Layout Components

### AppHeader

Persistent header bar displayed across all views with app branding, view-specific center content, and user controls.

**File:** [client/src/components/AppHeader.tsx](../../client/src/components/AppHeader.tsx)

**Props:**
```typescript
interface AppHeaderProps {
  content?: ReactNode;   // View-specific center content
  username?: string;     // Logged-in user's display name
  onLogout?: () => void; // Logout callback
}
```

**Features:**
- Left: "Shifting Maze" app title
- Center: Customizable content via `content` prop
  - Home page: "Games" heading
  - Game page: Game name as title, game code as subtitle
- Right: User display name + logout button (shown only when `username` and `onLogout` are provided)
- Flexbox layout with bottom border separator

**Usage:**
```tsx
// Unauthenticated (title only)
<AppHeader />

// Home page
<AppHeader
  content={<h2>Games</h2>}
  username={user.displayName}
  onLogout={logout}
/>

// Game detail page
<AppHeader
  content={
    <div>
      <h2>My Game</h2>
      <span>WXYZ</span>
    </div>
  }
  username={user.displayName}
  onLogout={logout}
/>
```

---

## Game Management Components

### CreateGameForm

Form for creating a new game.

**File:** [client/src/components/CreateGameForm.tsx](../../client/src/components/CreateGameForm.tsx)

**Props:**
```typescript
interface CreateGameFormProps {
  username: string;                                  // Current user's username
  onSuccess: (code: string, name: string) => void;   // Called when game is created
}
```

**Features:**
- Input field: game name
- Validation: 1-100 characters
- Displays generated 4-letter code on success
- Error message display
- Form resets after successful creation
- Calls `onSuccess` callback with code and name

**Usage:**
```tsx
<CreateGameForm
  username="john_doe"
  onSuccess={(code, name) => {
    alert(`Game created! Code: ${code}`);
    refreshGamesList();
  }}
/>
```

---

### JoinGameForm

Form for joining a game by code.

**File:** [client/src/components/JoinGameForm.tsx](../../client/src/components/JoinGameForm.tsx)

**Props:**
```typescript
interface JoinGameFormProps {
  username: string;       // Current user's username
  onSuccess: () => void;  // Called when user successfully joins
}
```

**Features:**
- Input field: game code (4 letters)
- Auto-uppercase transformation
- Validation: Exactly 4 uppercase letters
- Success and error message display
- Form resets after successful join
- Calls `onSuccess` callback to trigger list refresh

**Validation:**
```typescript
code: /^[A-Z]{4}$/
```

**Usage:**
```tsx
<JoinGameForm
  username="john_doe"
  onSuccess={() => {
    console.log('Joined game successfully');
    refreshGamesList();
  }}
/>
```

---

### GamesList

Displays all games the user is part of with detailed information and actions.

**File:** [client/src/components/GamesList.tsx](../../client/src/components/GamesList.tsx)

**Props:**
```typescript
interface GamesListProps {
  user: User;                                 // Current authenticated user
  refresh: number;                            // Increment to trigger re-fetch
  onViewGame?: (gameCode: string) => void;    // Callback when viewing a game (navigates to /game/:code)
}
```

**Features:**
- Fetches games on mount and when `refresh` prop changes
- Loading state display
- Error state with retry button
- Empty state message
- Manual refresh button
- For each game displays:
  - Game name (bold)
  - Game code, player count, stage
  - Current turn info (for playing games)
  - Color selector (for unstarted games)
  - Players list with colors
  - "Start Game" button (for creator of unstarted games with 2+ players)
  - "View Game" button (for playing/finished games)
- Color auto-refresh when dropdown is opened
- Real-time color updating

**States:**
- **Loading:** "Loading games..."
- **Error:** Error message with retry button
- **Empty:** "No games yet. Create or join a game to get started!"
- **Success:** List of games with details and actions

**Game Actions:**
- **Color Change:** Updates player color for unstarted games
- **Start Game:** Available to creator when 2-4 players joined
- **View Game:** Navigate to game detail page (playing/finished games only)

**Styling:**
- Uses CSS classes from main.css
- Game cards use `card` class for consistent appearance
- Buttons use `btn` classes (btn-primary, btn-secondary, btn-success)
- Text uses typography classes (header1, text-normal, text-supporting)
- Layout uses flex utilities (flex, justify-between, items-center, gap-*)
- Spacing uses margin utilities (mb-10, mb-15, mt-10, mt-15)

**Usage:**
```tsx
const [refreshGames, setRefreshGames] = useState(0);
const navigate = useNavigate();

<GamesList
  user={user}
  refresh={refreshGames}
  onViewGame={(code) => navigate(`/game/${code}`)}
/>

// Trigger refresh after creating/joining game
<CreateGameForm
  user={user}
  onSuccess={() => setRefreshGames(prev => prev + 1)}
/>
```

---

## Game Display Components

### GamePage

Main game view page that displays full game state including the board.

**File:** [client/src/components/GamePage.tsx](../../client/src/components/GamePage.tsx)

**Props:**
```typescript
interface GamePageProps {
  gameCode: string;   // The game code to display
  user: User;         // Current authenticated user
}
```

**Features:**
- Fetches full game details on mount using `getGameDetails` API
- Loading, error, and not-found states
- Game name and code displayed in AppHeader (via parent App)
- Three-column grid layout:
  1. Info panel (left) showing:
     - Game stage
     - Players list with color indicators (current player shown in bold with phase name)
  2. Game board (center, via GameBoard component)
  3. Tile in play panel (right) showing:
     - Current tile in play
     - Rotation controls (enabled during shift phase for current player)
- Fallback message if board state is not available

**States:**
- **Loading:** "Loading game..."
- **Error:** Error message displayed
- **Not Found:** "Game not found"
- **Success:** Full game view with board

**Styling:**
- Uses CSS classes from main.css
- Layout uses `grid-game-page` class for three-column layout
- Info and tile-in-play panels use `card` class
- Player color indicators use `player-indicator` class
- Rotation buttons use `btn btn-icon btn-info` classes
- SVG containers use `svg-board` and `svg-tile-in-play` classes
- Dynamic backgroundColor maintained for player color indicators

**Usage:**
```tsx
<GamePage
  gameCode="WXYZ"
  user={user}
/>
```

---

### GameBoard

SVG-based game board renderer showing tiles, tokens, and players with interactive shift controls.

**File:** [client/src/components/GameBoard.tsx](../../client/src/components/GameBoard.tsx)

**Props:**
```typescript
interface GameBoardProps {
  board: Tile[][];                            // 7x7 tile matrix
  playerPositions: { [color: string]: Position };
  tokenPositions: { [tokenId: string]: Position };
  controlsEnabled: boolean;                   // Whether shift controls are active
}
```

**Features:**
- Renders 7×7 board using SVG
- Shift arrows on rows 1, 3, 5 (top/bottom) and columns 1, 3, 5 (left/right)
- Arrows enabled/disabled based on `controlsEnabled` prop
- Handles multiple items on same tile with 2×2 grid layout
- Fixed tile size (80px)
- Black border around board

**Visual Components:**
- Tiles with paths (via Tile component)
- Tokens with values (via Token component)
- Player markers (via PlayerMarker component)
- Shift control arrows (orange when enabled, gray when disabled)

**Styling:**
- SVG container uses `svg-board` CSS class
- Arrow colors change based on `controlsEnabled` (orange/#17a2b8 or gray/#ccc)
- Cursor changes based on enabled state (pointer or not-allowed)

**Usage:**
```tsx
<GameBoard
  board={game.board}
  playerPositions={game.playerPositions}
  tokenPositions={game.tokenPositions}
  controlsEnabled={currentPlayer && shiftPhase}
/>
```

---

### Tile

SVG component rendering a single maze tile with paths.

**File:** [client/src/components/Tile.tsx](../../client/src/components/Tile.tsx)

**Props:**
```typescript
interface TileProps {
  tile: Tile;    // Bitmask 0-15 (LEFT=0x1, RIGHT=0x2, TOP=0x4, BOTTOM=0x8)
  x: number;     // X position in SVG
  y: number;     // Y position in SVG
  size?: number; // Tile size (default: 80px)
}
```

**Features:**
- Brown background (#8B4513)
- Sand-colored paths (#F4A460)
- Path width: 2/5 of tile size
- Black 1px outline
- Paths connect open sides to center
- Center square always present

**Tile Bitmask:**
```
LEFT   = 0x1 (Bit 0)
RIGHT  = 0x2 (Bit 1)
TOP    = 0x4 (Bit 2)
BOTTOM = 0x8 (Bit 3)
```

**Example Values:**
- 0x3 (LEFT | RIGHT) = straight horizontal path
- 0xC (TOP | BOTTOM) = straight vertical path
- 0xA (RIGHT | BOTTOM) = corner path
- 0xB (LEFT | RIGHT | BOTTOM) = T-junction

---

### Token

SVG component rendering a token (white circle with value).

**File:** [client/src/components/Token.tsx](../../client/src/components/Token.tsx)

**Props:**
```typescript
interface TokenProps {
  tokenId: TokenId;                              // 0-20
  x: number;                                     // Tile X position
  y: number;                                     // Tile Y position
  gridOffset: { dx: number; dy: number };        // Offset for multiple items
  tileSize?: number;                             // Default: 80px
}
```

**Features:**
- White circle with black 2px stroke
- Diameter: 1/2 of tile size (40px for 80px tile)
- Centered in tile + grid offset
- Token values:
  - Tokens 0-19 display 1-20
  - Token 20 displays 25
- Black bold text (16px Arial)

**Visual Specs:**
- Circle diameter: 0.5 × tileSize
- Text: centered, bold, 16px

---

### PlayerMarker

SVG component rendering a player marker (concentric circles).

**File:** [client/src/components/PlayerMarker.tsx](../../client/src/components/PlayerMarker.tsx)

**Props:**
```typescript
interface PlayerMarkerProps {
  color: PlayerColor;                            // 'red' | 'green' | 'blue' | 'white'
  x: number;                                     // Tile X position
  y: number;                                     // Tile Y position
  gridOffset: { dx: number; dy: number };        // Offset for multiple items
  tileSize?: number;                             // Default: 80px
}
```

**Features:**
- Two concentric circles in player's color
- Outer diameter: 3/10 of tile size (24px for 80px tile)
- Inner diameter: 1/5 of tile size (16px for 80px tile)
- Both circles have black 2px stroke
- Centered in tile + grid offset

**Visual Specs:**
- Outer circle: 0.3 × tileSize diameter
- Inner circle: 0.2 × tileSize diameter
- Both filled with player color

---

## Main Application Component

### App

Root application component with authentication and URL-based routing.

**File:** [client/src/App.tsx](../../client/src/App.tsx)

**Features:**
- Uses `useAuth` hook for authentication state
- URL-based routing using React Router
- AppHeader displayed on all views with view-specific center content
- View toggle between login and registration
- Navigation between games list and game detail
- Game list refresh mechanism

**Routes:**

1. **`/` - Home Route:**
   - **Unauthenticated:** Shows login/create account toggle (AuthPage component)
   - **Authenticated:** Shows games list (HomePage component)

2. **`/game/:code` - Game Detail Route:**
   - **Authenticated:** Shows game board and details (GameDetailPageWrapper component)
   - **Unauthenticated:** Redirects to `/`

**Page Components:**

1. **AuthPage:**
   - Toggle between Login and Create Account
   - LoginForm component
   - CreateUserForm component

2. **HomePage:**
   - AppHeader with "Games" center title, user info + logout
   - CreateGameForm component
   - JoinGameForm component
   - GamesList component (with "View Game" buttons for playing games)
   - Auto-refresh of games list after creating/joining

3. **GameDetailPageWrapper:**
   - Extracts `code` parameter from URL using `useParams()`
   - AppHeader with game code center content, user info + logout
   - GamePage component showing full game state
   - Back button to return to games list

**Navigation:**
```typescript
// Navigate to game detail page
const navigate = useNavigate();
navigate(`/game/${gameCode}`);

// Navigate back to home
navigate('/');
```

**URL Examples:**
- Home: `http://localhost:5173/`
- Game detail: `http://localhost:5173/game/WXYZ`

---

## Component Hierarchy

```
App
├── AppHeader (all views)
├── (Loading)
├── (Unauthenticated)
│   ├── LoginForm
│   └── CreateUserForm
└── (Authenticated)
    ├── Games View
    │   ├── CreateGameForm
    │   ├── JoinGameForm
    │   └── GamesList
    └── Game Detail View
        └── GamePage
            └── GameBoard
                ├── Tile (×49)
                ├── Token (×0-21)
                └── PlayerMarker (×2-4)
```

## Common Patterns

### Form Submission Pattern

All forms follow this pattern:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Validate
  if (!validate()) return;

  setSubmitting(true);
  setError('');

  try {
    const result = await apiCall();
    onSuccess(result);
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setSubmitting(false);
  }
};
```

### Error Display Pattern

```tsx
{error && (
  <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>
    {error}
  </div>
)}
```

### Disabled State Pattern

```tsx
<button
  disabled={submitting}
  style={{
    backgroundColor: submitting ? '#ccc' : '#007bff',
    cursor: submitting ? 'not-allowed' : 'pointer',
  }}
>
  {submitting ? 'Processing...' : 'Submit'}
</button>
```

## Styling

Components use a mix of CSS classes and inline styles:

**CSS Classes (from main.css):**
- Typography: `title`, `subtitle`, `header1`, `header2`, `text-normal`, `text-emphasized`, `text-supporting`
- Colors: `color-success`, `color-danger`, `color-muted`, `bg-light`
- Buttons: `btn`, `btn-sm`, `btn-md`, `btn-icon`, `btn-primary`, `btn-secondary`, `btn-success`, `btn-info`
- Layout: `flex`, `grid`, `items-center`, `justify-between`, `gap-8`, `gap-10`, `gap-12`, `gap-20`
- Spacing: `m-0`, `mt-*`, `mb-*`, `p-*`
- Cards: `card` (consistent panel styling)
- Forms: `input`, `label`
- Special: `player-indicator`, `svg-board`, `svg-tile-in-play`, `grid-game-page`

**Inline Styles (when necessary):**
- Dynamic colors (e.g., player backgroundColor)
- SVG-specific properties (fill, stroke)
- Custom grid templates
- List styling (margin, padding for ul/li)

**Color Palette:**
- Primary blue: #007bff
- Success green: #28a745
- Info cyan: #17a2b8
- Danger red: #dc3545
- Secondary gray: #6c757d
- Light background: #f8f9fa
- Disabled: #ccc
