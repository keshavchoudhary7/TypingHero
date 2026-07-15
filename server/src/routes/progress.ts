import { Router } from 'express';
import { getDatabase } from '../lib/db.js';
import { verifyToken } from '../models/user.js';

const router = Router();

const emptyProgress = {
  completedLevels: [],
  levelResults: {},
  activeLevelId: null,
  xp: 0,
  streak: 0,
  lastPlayedDate: null,
  dailyChallengeDoneDate: null,
  updatedAt: new Date(),
};

// Helper to determine the authenticated user or guest user ID
function getEffectiveUserId(req: any): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      return payload.userId;
    }
  }
  return req.params.userId;
}

router.get('/:userId', async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const db = await getDatabase();
    const progress = await db.collection('progress').findOne({ userId });
    res.json(progress ?? emptyProgress);
  } catch {
    res.status(503).json({ error: 'Database unavailable. Progress could not be loaded.' });
  }
});

router.post('/:userId', async (req, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const db = await getDatabase();
    const payload = {
      userId,
      ...req.body,
      updatedAt: new Date(),
    };

    // Strip out database ID if present in body to avoid MongoDB immutable field errors
    delete payload._id;

    await db.collection('progress').updateOne(
      { userId },
      { $set: payload },
      { upsert: true },
    );

    res.json({ success: true });
  } catch {
    res.status(503).json({ error: 'Database unavailable. Progress could not be saved.' });
  }
});

export default router;
