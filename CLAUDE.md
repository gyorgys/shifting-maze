# Claude Development Guidelines

This file contains instructions for Claude (AI assistant) when working on the Shifting Maze project.

## Documentation-First Approach

### Rule 0: Game Rules Are the Source of Truth

**⚠️ CRITICAL: For any game-related feature or business logic:**

1. **Always check `docs/game-rules.md` FIRST** before planning or implementing
2. This file defines:
   - How the game works (board setup, tiles, tokens)
   - Turn structure (shift phase, move phase)
   - Game rules (token collection order, movement constraints, win conditions)
   - All business logic for the Shifting Maze game

**Why:** The game rules documentation is the authoritative source for business logic. Implementing features without consulting it will result in incorrect game behavior.

**Example:**
```
User asks: "Implement token collection when a player moves"

MUST READ FIRST: docs/game-rules.md
→ Discover: Tokens must be collected in order (lowest value first)
→ Discover: Only the smallest value token on board is collectible
→ Implement: Check if landed token is current lowest before collecting

WITHOUT reading game rules:
→ Might implement: Collect any token player lands on (WRONG!)
```

### Rule 1: Check Documentation Before Planning

**When planning new changes or features:**

1. **Always read the relevant documentation first** in the `docs/` directory
2. Check the following files based on the task:
   - **`docs/game-rules.md`** - Game business logic (CHECK FIRST for game features)
   - `docs/README.md` - Overall architecture and quick reference
   - `docs/server/models.md` - If working with User or Game data structures
   - `docs/server/api-endpoints.md` - If adding/modifying API endpoints
   - `docs/client/components.md` - If adding/modifying React components
   - `docs/client/types.md` - If working with TypeScript types

**Why:** The documentation provides a comprehensive overview of existing patterns, conventions, and architecture. Reading it first will:
- Speed up planning by understanding current implementation
- Ensure consistency with existing code
- Prevent duplicating existing functionality
- Identify which files need to be modified

**Example workflow:**
```
User asks: "Add a feature to delete games"

Before planning:
1. Read docs/server/api-endpoints.md → See existing game endpoints
2. Read docs/server/models.md → Understand Game model structure
3. Read docs/client/components.md → See existing game management UI

Then plan:
- Add DELETE /api/games/:code endpoint (following existing patterns)
- Update gameService.ts (following existing service pattern)
- Add delete button to GamesList component (following existing button pattern)
- Update documentation
```

### Rule 2: Update Documentation Before Committing

**Before creating any commit:**

1. **Review what's being committed:**
   ```bash
   git status
   git diff
   ```

2. **Identify which documentation needs updating:**
   - Game logic changes → Update `docs/game-rules.md`
   - New/modified models → Update `docs/server/models.md`
   - New/modified API endpoints → Update `docs/server/api-endpoints.md`
   - New/modified components → Update `docs/client/components.md`
   - New/modified types → Update `docs/client/types.md`
   - Architecture changes → Update `docs/README.md`

3. **Update the documentation:**
   - Add new sections for new features
   - Update existing sections for modifications
   - Include code examples
   - Update API summary tables
   - Add cross-references where helpful

4. **Include documentation changes in the same commit:**
   ```bash
   git add docs/
   git add [code changes]
   git commit -m "Add feature X

   - Implements feature X in [files]
   - Updates documentation to reflect changes

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

**Why:** Keeping documentation in sync with code ensures:
- Documentation is always accurate and trustworthy
- Future developers (AI or human) can rely on the docs
- Code reviews are easier with updated documentation
- Knowledge is preserved even if original author is unavailable

**Example:**
```
Committing: Added DELETE /api/games/:code endpoint

Before commit checklist:
☑ Code added to routes/games.ts
☑ Service method added to gameService.ts
☐ Documentation updated → MUST DO THIS

Updates needed:
1. docs/server/api-endpoints.md:
   - Add "Delete Game" section with endpoint details
   - Update API summary table
2. docs/README.md:
   - Add DELETE endpoint to API summary table

After updating docs:
☑ Code changes
☑ Documentation changes
✓ Ready to commit
```

## Documentation Standards

### File Organization

- `docs/game-rules.md` - **Game business logic (authoritative source of truth)**
- `docs/README.md` - Main entry point, architecture, quick start
- `docs/server/` - All server-side documentation
- `docs/client/` - All client-side documentation

### Format Guidelines

- Use Markdown with proper headings
- Include code examples with syntax highlighting
- Link to actual source files using relative paths
- Use tables for API summaries
- Include both success and error cases
- Add "Why" explanations for important decisions

### Code Example Format

```typescript
// Good: Include type annotations and comments
interface Example {
  field: string;  // Brief explanation
}

// Show actual usage
const example: Example = {
  field: "value"
};
```

## Commit Message Guidelines

When committing changes that include documentation updates:

```
[Short summary of what changed]

[Detailed description of changes]

Documentation updates:
- Updated docs/[file] to reflect [change]
- Added section on [new feature]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Development Workflow

### For New Features

1. **Plan:**
   - Read relevant documentation
   - Understand existing patterns
   - Plan implementation following established conventions

2. **Implement:**
   - Write code following existing patterns
   - Follow TypeScript strict mode
   - Add proper error handling
   - Validate all inputs

3. **Document:**
   - Update all relevant documentation files
   - Add code examples
   - Include error cases
   - Update summary tables

4. **Commit:**
   - Stage code changes
   - Stage documentation changes
   - Write descriptive commit message
   - Push to GitHub

### For Bug Fixes

1. **Understand:**
   - Check documentation for intended behavior
   - Identify where actual behavior differs

2. **Fix:**
   - Correct the code
   - Update documentation if it was incorrect

3. **Document:**
   - If documentation was wrong, update it
   - If documentation was right, no update needed
   - Add notes about the fix if it's non-obvious

4. **Commit:**
   - Include both fix and any doc updates

## Project-Specific Patterns

### Server-Side

- Use async/await for all async operations
- Validate inputs in both routes and services
- Return appropriate HTTP status codes (200, 201, 400, 404, 409, 500)
- Handle errors with try-catch and meaningful messages
- Follow existing file storage patterns

### Client-Side

- Use functional components with hooks
- Follow existing form patterns (validation, error display, disabled state)
- **Use CSS classes from `client/src/styles/main.css`** (NOT inline styles)
- Call API service functions (don't use fetch directly in components)
- Update parent state through callbacks

### TypeScript

- Enable strict mode
- Define interfaces for all data structures
- Use proper types, avoid `any`
- Export types that are used across files

### Shared Code

- **Use `shared/` directory for all types and utilities used by both client and server**
- Types: Place in `shared/types/` (e.g., Game, Player, Tile, Token types)
- Utilities: Place in `shared/utils/` (e.g., tile manipulation functions)
- Both client and server import from `@shared/` alias
- **Never duplicate types or logic** - if it's used by both sides, it belongs in `shared/`

**Examples:**
```typescript
// ✅ GOOD: Shared type in shared/types/game.ts
export type PlayerColor = 'red' | 'green' | 'blue' | 'white';

// ✅ GOOD: Both import from shared
// client/src/components/GamePage.tsx
import { PlayerColor } from '@shared/types';

// server/src/models/Game.ts
import { PlayerColor } from '@shared/types';

// ❌ BAD: Duplicating type definition
// client/src/types/Game.ts
type PlayerColor = 'red' | 'green' | 'blue' | 'white';  // DON'T DO THIS!
```

## Quick Reference

**For game features:** Check `docs/game-rules.md` FIRST for business logic
**Before planning:** Check `docs/` for relevant documentation
**Before committing:** Update `docs/` to reflect your changes
**Always:** Follow existing patterns and conventions
**Remember:** Documentation is part of the feature, not an afterthought
