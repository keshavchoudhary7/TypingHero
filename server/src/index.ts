import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import challengeRouter from './routes/challenge.js';
import progressRouter from './routes/progress.js';
import authRouter from './routes/auth.js';
import leaderboardRouter from './routes/leaderboard.js';
import { connectToDatabase } from './lib/db.js';

import { initializeWebSocketServer } from './services/socketService.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

app.use('/api/challenges', challengeRouter);
app.use('/api/progress', progressRouter);
app.use('/api/auth', authRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'TypingHero server running' });
});

const server = app.listen(port, () => {
  void connectToDatabase()
    .then(() => {
      console.log(`TypingHero server listening on http://localhost:${port}`);
    })
    .catch((error) => {
      console.warn('MongoDB connection unavailable, continuing without persistence:', error);
      console.log(`TypingHero server listening on http://localhost:${port}`);
    });
});

initializeWebSocketServer(server);
