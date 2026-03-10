---
description: Make one move for the current player in the active game. Reads state from /tmp/shifting-maze-test-state.json. Uses GET /moves to pick the best legal action, then executes it.
---

Execute one move for the current player in the active Shifting Maze game.

Steps:
1. Read /tmp/shifting-maze-test-state.json to get the game code and user tokens.
2. GET http://localhost:3001/api/games/<code> (use testbot1's token) to find `currentTurn.username` and `currentTurn.phase`.
3. Look up that username's token from the state file.
4. GET http://localhost:3001/api/games/<code>/moves using that token.
5a. If phase is "shift": pick the best shift option using this priority:
    - Prefer entries where `canReachNextToken` is true
    - Among those (or all if none can reach token), pick highest `reachableTileCount`
    - Use the first entry if there's still a tie
    POST http://localhost:3001/api/games/<code>/shift with `{"tile":<tileToInsert>,"shiftType":"...","shiftIndex":...,"direction":"..."}` using the current player's token.
5b. If phase is "move": pick the target position using this priority:
    - If `nextTokenToCollect` exists and `reachable` is true, move to `nextTokenToCollect.position`
    - Otherwise pick the first position from `reachableTiles` that has a `token` in the board data, or just `reachableTiles[0]` as fallback
    POST http://localhost:3001/api/games/<code>/move with `{"row":...,"col":...}` using the current player's token.
6. Report what move was made and the updated game state (stage, whose turn it is now).

Use the Bash tool for all HTTP calls.
