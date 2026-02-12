import { Router } from 'express';
import { createTeam, myTeam } from '../controllers/teamController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/teams', requireAuth(), requireRole(['student']), createTeam);
router.get('/teams/my', requireAuth(), requireRole(['student']), myTeam);

export default router;
