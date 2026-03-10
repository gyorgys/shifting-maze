---
description: Create a new game with testbot1, have testbot2 join, then start it. Reads tokens from /tmp/shifting-maze-test-state.json and saves the game code back.
---

Start a new Shifting Maze game using the two test bots.

Steps:
1. Read /tmp/shifting-maze-test-state.json — extract token1 (testbot1) and token2 (testbot2).
2. POST http://localhost:3001/api/games with body `{"name":"Test Game"}` using token1. Extract `code` from response.
3. POST http://localhost:3001/api/games/<code>/join with body `{}` using token2.
4. POST http://localhost:3001/api/games/<code>/start with body `{}` using token1.
5. Update /tmp/shifting-maze-test-state.json, setting `currentGame: {"code":"<code>"}`.
6. Report the game code and that the game is started.

Use the Bash tool for all HTTP calls with `Authorization: Bearer <token>` header.
