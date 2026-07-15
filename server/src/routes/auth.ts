import { Router } from 'express';
import { getDatabase } from '../lib/db.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../models/user.js';
import { ObjectId } from 'mongodb';

const router = Router();

// ─── Middleware for Token Authentication ────────────────────────────────────
export async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      avatarId: user.avatarId || 'knight',
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// ─── POST /register ─────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password, avatarId } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const db = await getDatabase();
    
    // Check if user already exists (case-insensitive)
    const existing = await db.collection('users').findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const passwordHash = hashPassword(password);
    const selectedAvatar = avatarId || 'knight';

    const result = await db.collection('users').insertOne({
      username: trimmedUsername,
      passwordHash,
      avatarId: selectedAvatar,
      createdAt: new Date(),
    });

    const userId = result.insertedId.toString();
    const token = signToken({ userId, username: trimmedUsername });

    // Initialize progress for this new user in the progress collection as well
    await db.collection('progress').updateOne(
      { userId },
      {
        $setOnInsert: {
          userId,
          completedLevels: [],
          levelResults: {},
          activeLevelId: null,
          xp: 0,
          streak: 0,
          lastPlayedDate: null,
          dailyChallengeDoneDate: null,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: userId,
        username: trimmedUsername,
        avatarId: selectedAvatar,
      }
    });
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Server error. Registration failed.' });
  }
});

// ─── POST /login ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userId = user._id.toString();
    const token = signToken({ userId, username: user.username });

    return res.json({
      success: true,
      token,
      user: {
        id: userId,
        username: user.username,
        avatarId: user.avatarId || 'knight',
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Server error. Login failed.' });
  }
});

// ─── GET /me ────────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req: any, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// ─── POST /avatar ───────────────────────────────────────────────────────────
router.post('/avatar', requireAuth, async (req: any, res) => {
  const { avatarId } = req.body;
  if (!avatarId) {
    return res.status(400).json({ error: 'Avatar ID is required' });
  }

  try {
    const db = await getDatabase();
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { avatarId } }
    );
    return res.json({ success: true, avatarId });
  } catch (error) {
    console.error('Failed to update avatar:', error);
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
});

export default router;
