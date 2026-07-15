import { Router } from 'express';
import { getDatabase } from '../lib/db.js';
import { validateAttempt } from '../services/validateService.js';
import { verifyToken } from '../models/user.js';
import { ObjectId } from 'mongodb';

const router = Router();

// Optional Auth Middleware to grab user context if available
async function optionalAuth(req: any, _res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      try {
        const db = await getDatabase();
        const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
        if (user) {
          req.user = {
            id: user._id.toString(),
            username: user.username,
            avatarId: user.avatarId || 'knight',
          };
        }
      } catch {
        // ignore
      }
    }
  }
  next();
}

// ─── POST /submit ───────────────────────────────────────────────────────────
router.post('/submit', optionalAuth, async (req: any, res) => {
  const { levelId, wpm, accuracy, elapsedMs, logs, passage, stars } = req.body;

  if (levelId === undefined || wpm === undefined || accuracy === undefined || elapsedMs === undefined || !passage) {
    return res.status(400).json({ error: 'Missing required validation fields.' });
  }

  // Determine user info
  const userId = req.user?.id || 'guest-' + Math.random().toString(36).substring(2, 9);
  const username = req.user?.username || req.body.username || 'Guest Hero';
  const avatarId = req.user?.avatarId || req.body.avatarId || 'knight';

  // Run validation checks
  const valResult = validateAttempt({
    passage,
    wpm: Number(wpm),
    accuracy: Number(accuracy),
    elapsedMs: Number(elapsedMs),
    logs,
  });

  const attemptStatus = valResult.valid ? 'valid' : 'flagged';
  const attemptReason = valResult.reason || '';

  try {
    const db = await getDatabase();
    
    // Save to attempts collection
    await db.collection('attempts').insertOne({
      userId,
      username,
      avatarId,
      levelId: Number(levelId),
      wpm: Number(wpm),
      accuracy: Number(accuracy),
      netWpm: Math.round(Number(wpm) * (Number(accuracy) / 100)),
      stars: Number(stars ?? 0),
      status: attemptStatus,
      reason: attemptReason,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      status: attemptStatus,
      reason: attemptReason,
    });
  } catch (error) {
    console.error('Failed to submit score:', error);
    return res.status(500).json({ error: 'Database error. Score submission failed.' });
  }
});

// ─── GET /global ────────────────────────────────────────────────────────────
router.get('/global', async (_req, res) => {
  try {
    const db = await getDatabase();
    
    const leaders = await db.collection('progress').aggregate([
      { $match: { xp: { $gt: 0 } } },
      { $sort: { xp: -1 } },
      { $limit: 25 },
      {
        $addFields: {
          userObjId: {
            $cond: {
              if: { $eq: [{ $strLenCP: "$userId" }, 24] },
              then: { $toObjectId: "$userId" },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: 1,
          xp: 1,
          streak: 1,
          username: { $ifNull: ['$userInfo.username', 'Guest Hero'] },
          avatarId: { $ifNull: ['$userInfo.avatarId', 'knight'] }
        }
      }
    ]).toArray();

    return res.json(leaders);
  } catch (error) {
    console.error('Failed to retrieve global leaderboard:', error);
    return res.status(500).json({ error: 'Database unavailable. Could not fetch global leaderboard.' });
  }
});

// ─── GET /level/:levelId ────────────────────────────────────────────────────
router.get('/level/:levelId', async (req, res) => {
  const levelId = Number(req.params.levelId);
  if (isNaN(levelId)) {
    return res.status(400).json({ error: 'Invalid level ID parameter.' });
  }

  try {
    const db = await getDatabase();

    const runs = await db.collection('attempts').aggregate([
      {
        $match: {
          levelId: levelId,
          status: 'valid'
        }
      },
      { $sort: { wpm: -1, accuracy: -1 } },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          avatarId: { $first: '$avatarId' },
          wpm: { $first: '$wpm' },
          accuracy: { $first: '$accuracy' },
          stars: { $first: '$stars' },
          createdAt: { $first: '$createdAt' }
        }
      },
      { $sort: { wpm: -1, accuracy: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: 1,
          avatarId: 1,
          wpm: 1,
          accuracy: 1,
          stars: 1,
          createdAt: 1
        }
      }
    ]).toArray();

    return res.json(runs);
  } catch (error) {
    console.error('Failed to retrieve level leaderboard:', error);
    return res.status(500).json({ error: 'Database unavailable. Could not fetch level leaderboard.' });
  }
});

export default router;
