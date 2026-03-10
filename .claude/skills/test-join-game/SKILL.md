---
description: Join the current game (from state file) with a specified player. Usage: /test-join-game [testbot1|testbot2]
---

Join the current Shifting Maze game with the specified test bot.

Steps:
1. Read /tmp/shifting-maze-test-state.json — get game code and the token for the requested player (default: testbot2 if no argument given).
2. POST http://localhost:3001/api/games/<code>/join with body `{}` using that player's token.
3. Report success or the error.

Use the Bash tool with `Authorization: Bearer <token>` header.
