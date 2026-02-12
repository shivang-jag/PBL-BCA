import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { broadcastMessage, getAssignedTeam, gradeTeam, listAssignedTeams } from '../controllers/teacherController.js';

const router = Router();

router.get('/teams', requireAuth(), requireRole('teacher'), listAssignedTeams);
router.get('/team/:id', requireAuth(), requireRole('teacher'), getAssignedTeam);
router.put('/grade', requireAuth(), requireRole('teacher'), gradeTeam);
router.post('/broadcast', requireAuth(), requireRole('teacher'), broadcastMessage);

export default router;
