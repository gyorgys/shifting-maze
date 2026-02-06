import { Router, Request, Response } from 'express';
import * as gameService from '../services/gameService';
import { CreateGameRequest, JoinGameRequest } from '../models/Game';

const router = Router();

// POST /api/games - Create new game
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreateGameRequest = req.body;

    // Validate request body
    if (!data.name || !data.createdBy) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Create game
    const game = await gameService.createGame(data);

    // Return game code and name
    res.status(201).json({
      code: game.code,
      name: game.name,
    });
  } catch (error) {
    console.error('Error creating game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Invalid')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/games?username=xxx - List games for user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Username query parameter required' });
      return;
    }

    // Get games for user
    const games = await gameService.listGamesByUser(username);

    // Format response
    res.status(200).json({
      games: games.map(game => ({
        code: game.code,
        name: game.name,
        userCount: game.users.length,
      })),
    });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:code/join - Join game by code
router.post('/:code/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const data: JoinGameRequest = req.body;

    // Validate request body
    if (!data.username) {
      res.status(400).json({ error: 'Username required' });
      return;
    }

    // Add user to game
    await gameService.addUserToGame(code, data.username);

    res.status(200).json({ message: 'Successfully joined game' });
  } catch (error) {
    console.error('Error joining game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('already in game')) {
      res.status(409).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
