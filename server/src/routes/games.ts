import { Router, Request, Response } from 'express';
import * as gameService from '../services/gameService';
import { CreateGameRequest, JoinGameRequest, UpdatePlayerColorRequest, PlayerColor } from '../models/Game';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/games - Create new game (requires authentication)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreateGameRequest = req.body;

    // Validate request body
    if (!data.name) {
      res.status(400).json({ error: 'Game name required' });
      return;
    }

    // Create game with authenticated user as creator
    const game = await gameService.createGame(data.name, req.user!.username);

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

// GET /api/games - List games for authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get games for authenticated user
    const games = await gameService.listGamesByUser(req.user!.username);

    // Format response with enhanced game state information
    res.status(200).json({
      games: games.map(game => {
        const baseInfo = {
          code: game.code,
          name: game.name,
          createdBy: game.createdBy,  // Include creator username
          userCount: game.players.length,
          stage: game.stage,
          players: game.players,  // Always include players with their colors
        };

        // Add available colors if game can be joined (unstarted and not full)
        if (game.stage === 'unstarted' && game.players.length < game.maxPlayers) {
          const allColors: PlayerColor[] = ['red', 'green', 'blue', 'white'];
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

// GET /api/games/:code - Get single game with full details
router.get('/:code', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const username = req.user!.username;

    // Get game by code
    const game = await gameService.getGameByCode(code);

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Check if user is in this game
    if (!game.players.some(p => p.username === username)) {
      res.status(403).json({ error: 'Not authorized to view this game' });
      return;
    }

    // Format response with currentTurn if game is playing
    const response: any = {
      code: game.code,
      name: game.name,
      createdBy: game.createdBy,
      userCount: game.players.length,
      stage: game.stage,
      players: game.players,
    };

    // Add available colors if game can be joined (unstarted and not full)
    if (game.stage === 'unstarted' && game.players.length < game.maxPlayers) {
      const allColors: PlayerColor[] = ['red', 'green', 'blue', 'white'];
      const takenColors = game.players.map(p => p.color);
      const availableColors = allColors.filter(color => !takenColors.includes(color));
      response.availableColors = availableColors;
    }

    // Add current turn info if game is playing
    if (game.stage === 'playing' && game.currentPlayerIndex !== undefined && game.currentPhase) {
      const currentPlayer = game.players[game.currentPlayerIndex];
      response.currentTurn = {
        username: currentPlayer.username,
        color: currentPlayer.color,
        phase: game.currentPhase,
      };
    }

    // Add board state if present
    if (game.board) response.board = game.board;
    if (game.tileInPlay !== undefined) response.tileInPlay = game.tileInPlay;
    if (game.playerPositions) response.playerPositions = game.playerPositions;
    if (game.tokenPositions) response.tokenPositions = game.tokenPositions;
    if (game.collectedTokens) response.collectedTokens = game.collectedTokens;

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:code/join - Join game by code (auto-assigns color if not provided)
router.post('/:code/join', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const data: JoinGameRequest = req.body;

    // Validate color if provided
    if (data.color) {
      const validColors = ['red', 'green', 'blue', 'white'];
      if (!validColors.includes(data.color)) {
        res.status(400).json({ error: 'Invalid color. Must be red, green, blue, or white' });
        return;
      }
    }

    // Add authenticated user to game (color will be auto-assigned if not provided)
    await gameService.addUserToGame(code, req.user!.username, data.color);

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
router.post('/:code/start', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    // Start the game with authenticated user
    await gameService.startGame(code, req.user!.username);

    res.status(200).json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('already started') ||
               errorMessage.includes('Need at least') ||
               errorMessage.includes('Only the game creator')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/games/:code/shift - Perform a shift action during the shift phase
router.post('/:code/shift', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { tile, shiftType, shiftIndex, direction } = req.body;
    const username = req.user!.username;

    // Validate request body
    if (typeof tile !== 'number' || tile < 0 || tile > 15) {
      res.status(400).json({ error: 'Invalid tile value (must be 0-15)' });
      return;
    }
    if (!['row', 'column'].includes(shiftType)) {
      res.status(400).json({ error: 'Invalid shift type (must be row or column)' });
      return;
    }
    if (![1, 3, 5].includes(shiftIndex)) {
      res.status(400).json({ error: 'Invalid shift index (must be 1, 3, or 5)' });
      return;
    }
    const validDirections = shiftType === 'row' ? ['left', 'right'] : ['up', 'down'];
    if (!validDirections.includes(direction)) {
      res.status(400).json({ error: `Invalid direction for ${shiftType} shift` });
      return;
    }

    const game = await gameService.performShift(code, username, tile, shiftType, shiftIndex, direction);

    // Return full game state (same format as GET /api/games/:code)
    const currentPlayer = game.players[game.currentPlayerIndex!];
    res.status(200).json({
      code: game.code,
      name: game.name,
      createdBy: game.createdBy,
      userCount: game.players.length,
      stage: game.stage,
      players: game.players,
      currentTurn: {
        username: currentPlayer.username,
        color: currentPlayer.color,
        phase: game.currentPhase,
      },
      board: game.board,
      tileInPlay: game.tileInPlay,
      playerPositions: game.playerPositions,
      tokenPositions: game.tokenPositions,
      collectedTokens: game.collectedTokens,
    });
  } catch (error) {
    console.error('Error performing shift:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Not your turn') || errorMessage.includes('Not in shift phase') || errorMessage.includes('not in this game')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('not in progress') || errorMessage.includes('Invalid')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/games/:code/players/color - Update authenticated player's color
router.put('/:code/players/color', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
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

    // Update authenticated player's color
    await gameService.updatePlayerColor(code, req.user!.username, data.color);

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
