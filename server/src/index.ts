import express, { Express } from 'express';
import cors from 'cors';
import { getHome } from './routes/home';
import userRoutes from './routes/users';
import gameRoutes from './routes/games';

const app: Express = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/home', getHome);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
