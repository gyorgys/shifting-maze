---
description: Create two test users (testbot1, testbot2) and save their JWT tokens to /tmp/shifting-maze-test-state.json. Replaces any existing test state.
---

Create two Shifting Maze test users by calling the test API, then save the result.

Steps:
1. POST http://localhost:3001/api/test/users with body `{"username":"testbot1","displayName":"Test Bot 1"}`. If 409, call DELETE http://localhost:3001/api/test/cleanup first, then retry both users.
2. POST http://localhost:3001/api/test/users with body `{"username":"testbot2","displayName":"Test Bot 2"}`.
3. Write /tmp/shifting-maze-test-state.json with the structure:
   `{"users":{"testbot1":{"username":"testbot1","token":"<token1>"},"testbot2":{"username":"testbot2","token":"<token2>"}},"currentGame":null}`
4. Report success with usernames.

Use the Bash tool for all HTTP calls (curl -s -X POST -H "Content-Type: application/json").
