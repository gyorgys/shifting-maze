import { Router, Request, Response } from 'express';
import * as gameService from '../services/gameService';
import { CreateGameRequest, JoinGameRequest, StartGameRequest, UpdatePlayerColorRequest } from '../models/Game';

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

    // Format response with enhanced game state information
    res.status(200).json({
      games: games.map(game => {
        const baseInfo = {
          code: game.code,
          name: game.name,
          userCount: game.players.length,
          stage: game.stage,
          players: game.players,  // Always include players with their colors
        };

        // Add available colors if game can be joined (unstarted and not full)
        if (game.stage === 'unstarted' && game.players.length < game.maxPlayers) {
          const allColors: Array<'red' | 'green' | 'blue' | 'white'> = ['red', 'green', 'blue', 'white'];
          const takenColors = game.players.map(p => p.color);
          const availableColors = allColors.filter(color => !takenColors.includes(color));
          return { ...baseInfo, availableColors };
        }

        // Add current turn info if game is playing
        if (game.stage === 'playing' && game.currentPlayerIndex !== undefined && game.currentPhase) {
          const currentPlayer = game.players[game.currentPlayerIndex];
          return {
            ...baseInfo,
            currentTurn: {
              username: currentPlayer.username,
              color: currentPlayer.color,
              phase: game.currentPhase,
            },
          };
        }

        return baseInfo;
      }),
    });
  } catch (error) {
    console.error('Error listing games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:code/join - Join game by code (auto-assigns color if not provided)
router.post('/:code/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const data: JoinGameRequest = req.body;

    // Validate request body
    if (!data.username) {
      res.status(400).json({ error: 'Username required' });
      return;
    }

    // Validate color if provided
    if (data.color) {
      const validColors = ['red', 'green', 'blue', 'white'];
      if (!validColors.includes(data.color)) {
        res.status(400).json({ error: 'Invalid color. Must be red, green, blue, or white' });
        return;
      }
    }

    // Add user to game (color will be auto-assigned if not provided)
    await gameService.addUserToGame(code, data.username, data.color);

    res.status(200).json({ message: 'Successfully joined game' });
  } catch (error) {
    console.error('Error joining game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('already in game') ||
               errorMessage.includes('already taken') ||
               errorMessage.includes('full') ||
               errorMessage.includes('already started')) {
      res.status(409).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/games/:code/start - Start the game
router.post('/:code/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    // Start the game
    await gameService.startGame(code);

    res.status(200).json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('already started') ||
               errorMessage.includes('Need at least')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/games/:code/players/:username - Update player's color
router.put('/:code/players/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, username } = req.params;
    const data: UpdatePlayerColorRequest = req.body;

    // Validate request body
    if (!data.color) {
      res.status(400).json({ error: 'Color required' });
      return;
    }

    // Validate color
    const validColors = ['red', 'green', 'blue', 'white'];
    if (!validColors.includes(data.color)) {
      res.status(400).json({ error: 'Invalid color. Must be red, green, blue, or white' });
      return;
    }

    // Update player's color
    await gameService.updatePlayerColor(code, username, data.color);

    res.status(200).json({ message: 'Color updated successfully' });
  } catch (error) {
    console.error('Error updating player color:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('not in this game') ||
               errorMessage.includes('already taken') ||
               errorMessage.includes('already started')) {
      res.status(409).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
