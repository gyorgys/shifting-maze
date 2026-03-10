import { Router } from 'express';
import * as testService from '../services/testService';

const router = Router();

// POST /api/test/users — create a test user, return JWT token (no auth required)
router.post('/users', async (req, res) => {
  try {
    const { username, displayName } = req.body;
    if (!username || !displayName) {
      res.status(400).json({ error: 'username and displayName required' });
      return;
    }
    const result = await testService.createTestUser(username, displayName);
    res.status(201).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('already exists')) res.status(409).json({ error: msg });
    else if (msg.includes('Invalid')) res.status(400).json({ error: msg });
    else res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/test/cleanup — delete all test users and their games (no auth required)
router.delete('/cleanup', async (_req, res) => {
  try {
    const result = await testService.cleanupTestData();
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
