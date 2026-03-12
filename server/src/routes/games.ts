import { Router, Request, Response } from 'express';
import * as gameService from '../services/gameService';
import * as testService from '../services/testService';
import { getBestMoves } from '../services/botService';
import { Game, CreateGameRequest, JoinGameRequest, UpdatePlayerColorRequest, PlayerColor } from '../models/Game';
import { authenticateToken } from '../middleware/auth';
import { gameEmitter } from '../utils/gameEvents';

const router = Router();

// Helper: build the full game response object (same shape used by GET, poll, shift, move, resign)
function formatGameResponse(game: Game): Record<string, unknown> {
  const response: Record<string, unknown> = {
    code: game.code,
    name: game.name,
    createdBy: game.createdBy,
    userCount: game.players.length,
    stage: game.stage,
    players: game.players,
    version: game.version ?? 0,
  };

  if (game.stage === 'unstarted' && game.players.length < game.maxPlayers) {
    const allColors: PlayerColor[] = ['red', 'green', 'blue', 'white'];
    const takenColors = game.players.map(p => p.color);
    response.availableColors = allColors.filter(color => !takenColors.includes(color));
  }

  if (game.stage === 'playing' && game.currentPlayerIndex !== undefined && game.currentPhase) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    response.currentTurn = {
      username: currentPlayer.username,
      color: currentPlayer.color,
      phase: game.currentPhase,
    };
  }

  if (game.lastShift) response.lastShift = game.lastShift;
  if (game.board) response.board = game.board;
  if (game.tileInPlay !== undefined) response.tileInPlay = game.tileInPlay;
  if (game.playerPositions) response.playerPositions = game.playerPositions;
  if (game.tokenPositions) response.tokenPositions = game.tokenPositions;
  if (game.collectedTokens) response.collectedTokens = game.collectedTokens;

  return response;
}

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
    const finished = req.query.finished === 'true';
    const allGames = await gameService.listGamesByUser(req.user!.username);

    // Filter by finished/active
    const games = allGames.filter(game =>
      finished ? game.stage === 'finished' : game.stage !== 'finished'
    );

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

        // Finished games: include finishedAt and scores
        if (game.stage === 'finished') {
          return { ...baseInfo, finishedAt: game.finishedAt, scores: game.scores ?? {} };
        }

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

    res.status(200).json(formatGameResponse(game));
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
    res.status(200).json(formatGameResponse(game));
  } catch (error) {
    console.error('Error performing shift:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Not your turn') || errorMessage.includes('Not in shift phase') || errorMessage.includes('not in this game')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('not in progress') || errorMessage.includes('Invalid') || errorMessage.includes('Cannot reverse')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/games/:code/move - Perform a move action during the move phase
router.post('/:code/move', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { row, col } = req.body;
    const username = req.user!.username;

    // Validate request body
    if (!Number.isInteger(row) || row < 0 || row > 6) {
      res.status(400).json({ error: 'Invalid row (must be integer 0-6)' });
      return;
    }
    if (!Number.isInteger(col) || col < 0 || col > 6) {
      res.status(400).json({ error: 'Invalid col (must be integer 0-6)' });
      return;
    }

    const game = await gameService.performMove(code, username, row, col);
    res.status(200).json(formatGameResponse(game));
  } catch (error) {
    console.error('Error performing move:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (
      errorMessage.includes('Not your turn') ||
      errorMessage.includes('Not in move phase') ||
      errorMessage.includes('not in this game') ||
      errorMessage.includes('unreachable')
    ) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('not in progress') || errorMessage.includes('Invalid')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/games/:code/resign - Resign from game (ends game immediately)
router.post('/:code/resign', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const username = req.user!.username;

    const game = await gameService.resignGame(code, username);
    res.status(200).json(formatGameResponse(game));
  } catch (error) {
    console.error('Error resigning game:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Not your turn') || errorMessage.includes('not in this game')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('not in progress')) {
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

// POST /api/games/:code/bot-move - Compute and execute best move for the current player
router.post('/:code/bot-move', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const username = req.user!.username;

    const game = await gameService.getGameByCode(code);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (game.stage !== 'playing') {
      res.status(400).json({ error: 'Game is not in progress' });
      return;
    }
    if (game.currentPhase !== 'shift') {
      res.status(400).json({ error: 'Not in shift phase' });
      return;
    }
    if (!game.players.some(p => p.username === username)) {
      res.status(403).json({ error: 'Not authorized to act in this game' });
      return;
    }

    const { timeLimitMs } = req.body;
    const limit = (typeof timeLimitMs === 'number' && timeLimitMs > 0) ? timeLimitMs : 5000;

    const currentPlayer = game.players[game.currentPlayerIndex!];
    const bestTurn = getBestMoves(game, currentPlayer.color, limit);

    await gameService.performShift(code, currentPlayer.username,
      bestTurn.tileToInsert, bestTurn.shiftType, bestTurn.shiftIndex, bestTurn.direction);
    const finalGame = await gameService.performMove(code, currentPlayer.username,
      bestTurn.moveTo[0], bestTurn.moveTo[1]);

    res.json(formatGameResponse(finalGame));
  } catch (error) {
    console.error('Error executing bot move:', error);
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('not found')) {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage.includes('Not your turn') || errorMessage.includes('not in this game')) {
      res.status(403).json({ error: errorMessage });
    } else if (errorMessage.includes('not in progress') || errorMessage.includes('Invalid') || errorMessage.includes('Cannot reverse')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/games/:code/moves - Get all possible moves for current player (test users only)
router.get('/:code/moves', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await testService.getPossibleMoves(req.params.code, req.user!.username);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('not found')) res.status(404).json({ error: msg });
    else if (msg.includes('not authorized') || msg.includes('test')) res.status(403).json({ error: msg });
    else res.status(400).json({ error: msg });
  }
});

// GET /api/games/:code/poll?version=N - Long poll for game state changes
router.get('/:code/poll', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  const clientVersion = parseInt(req.query.version as string) || 0;
  const username = req.user!.username;

  try {
    const game = await gameService.getGameByCode(code);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    if (!game.players.some(p => p.username === username)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    // Already newer — respond immediately
    if ((game.version ?? 0) > clientVersion) {
      res.status(200).json(formatGameResponse(game));
      return;
    }

    // Wait for update event
    let done = false;

    const onUpdate = async () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        const updated = await gameService.getGameByCode(code);
        if (updated) res.status(200).json(formatGameResponse(updated));
        else res.status(404).json({ error: 'Game not found' });
      } catch {
        res.status(500).json({ error: 'Internal server error' });
      }
    };

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      gameEmitter.removeListener(`update:${code}`, onUpdate);
      res.status(200).json({ changed: false });
    }, 30000);

    req.on('close', () => {
      done = true;
      clearTimeout(timer);
      gameEmitter.removeListener(`update:${code}`, onUpdate);
    });

    gameEmitter.once(`update:${code}`, onUpdate);
  } catch (error) {
    console.error('Error in poll endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
