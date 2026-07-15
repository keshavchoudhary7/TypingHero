import { Router } from 'express';
import { generateChallenge } from '../services/challengeService.js';

const router = Router();

router.post('/', async (req, res) => {
  const { level, difficulty } = req.body as { level?: number; difficulty?: string };

  if (typeof level !== 'number') {
    return res.status(400).json({ error: 'Missing required level numeric field.' });
  }

  try {
    const challenge = await generateChallenge(level, difficulty ?? 'medium');
    return res.json(challenge);
  } catch (error) {
    console.error('Failed to generate challenge:', error);
    return res.status(500).json({ error: 'Unable to generate challenge.' });
  }
});

export default router;
