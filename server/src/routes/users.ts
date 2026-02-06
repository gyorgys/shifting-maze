import { Router, Request, Response } from 'express';
import * as userService from '../services/userService';
import { CreateUserRequest, LoginRequest } from '../models/User';
import { generateToken } from '../middleware/auth';

const router = Router();

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreateUserRequest = req.body;

    // Validate request body
    if (!data.username || !data.displayName || !data.passwordHash || !data.salt) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Create user
    const user = await userService.createUser(data);

    // Return user without sensitive data
    res.status(201).json({
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error creating user:', error);

    const errorMessage = (error as Error).message;
    if (errorMessage.includes('already exists')) {
      res.status(409).json({ error: errorMessage });
    } else if (errorMessage.includes('Invalid')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/users/:username/salt - Get salt for password hashing
router.get('/:username/salt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const salt = await userService.getUserSalt(username);

    if (!salt) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ salt });
  } catch (error) {
    console.error('Error getting salt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login - Authenticate user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: LoginRequest = req.body;

    // Validate request body
    if (!data.username || !data.passwordHash) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate login
    const isValid = await userService.validateLogin(data.username, data.passwordHash);

    if (isValid) {
      const user = await userService.getUserByUsername(data.username);
      const token = generateToken(user!.username, user!.displayName);

      res.status(200).json({
        success: true,
        token,
        user: {
          username: user!.username,
          displayName: user!.displayName,
        },
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
