import express from 'express';
import { fetchUserRepositories } from '../services/github.service.js';

const router = express.Router();

router.get('/analyze-github/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const repos = await fetchUserRepositories(username);
    res.status(200).json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;
