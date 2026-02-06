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

Displays all games the user is part of.

**File:** [client/src/components/GamesList.tsx](../../client/src/components/GamesList.tsx)

**Props:**
```typescript
interface GamesListProps {
  username: string;  // Current user's username
  refresh: number;   // Increment to trigger re-fetch
}
```

**Features:**
- Fetches games on mount and when `refresh` prop changes
- Loading state display
- Error state with retry button
- Empty state message
- Manual refresh button
- Displays for each game:
  - Game name (bold)
  - Game code
  - Player count

**States:**
- **Loading:** "Loading games..."
- **Error:** Error message with retry button
- **Empty:** "No games yet. Create or join a game to get started!"
- **Success:** List of games with details

**Usage:**
```tsx
const [refreshGames, setRefreshGames] = useState(0);

<GamesList
  username="john_doe"
  refresh={refreshGames}
/>

// Trigger refresh after creating/joining game
<CreateGameForm
  username="john_doe"
  onSuccess={() => setRefreshGames(prev => prev + 1)}
/>
```

---

## Main Application Component

### App

Root application component with authentication state management.

**File:** [client/src/App.tsx](../../client/src/App.tsx)

**Features:**
- Uses `useAuth` hook for authentication state
- Conditional rendering based on auth status
- View toggle between login and registration
- Game list refresh mechanism

**Views:**

1. **Loading State:**
   - Shown while checking localStorage for existing session

2. **Unauthenticated View:**
   - Toggle between Login and Create Account
   - LoginForm component
   - CreateUserForm component
   - Toggle buttons to switch views

3. **Authenticated View:**
   - Welcome message with user's display name
   - Logout button
   - CreateGameForm component
   - JoinGameForm component
   - GamesList component
   - Auto-refresh of games list after creating/joining

**State Management:**
```typescript
const { user, loading, login, logout } = useAuth();
const [view, setView] = useState<'login' | 'create'>('login');
const [refreshGames, setRefreshGames] = useState(0);
```

---

## Component Hierarchy

```
App
├── (Loading)
├── (Unauthenticated)
│   ├── LoginForm
│   └── CreateUserForm
└── (Authenticated)
    ├── CreateGameForm
    ├── JoinGameForm
    └── GamesList
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

All components use inline styles with consistent patterns:
- Font family: Arial, sans-serif
- Padding: 20px for containers, 8px for inputs
- Colors:
  - Primary blue: #007bff (login/submit)
  - Success green: #28a745 (create game)
  - Info cyan: #17a2b8 (join game)
  - Danger red: #dc3545 (logout, errors)
  - Gray: #6c757d (refresh, disabled)
- Form inputs: 100% width, consistent padding
- Buttons: Consistent sizing and hover states
