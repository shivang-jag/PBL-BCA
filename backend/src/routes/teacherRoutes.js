import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
	broadcastMessage,
	deleteMyBroadcast,
	getAssignedTeam,
	gradeTeam,
	listAssignedTeams,
	listMyBroadcasts,
} from '../controllers/teacherController.js';

const router = Router();

router.get('/teams', requireAuth(), requireRole('teacher'), listAssignedTeams);
router.get('/team/:id', requireAuth(), requireRole('teacher'), getAssignedTeam);
router.put('/grade', requireAuth(), requireRole('teacher'), gradeTeam);
router.post('/broadcast', requireAuth(), requireRole('teacher'), broadcastMessage);

router.get('/messages', requireAuth(), requireRole('teacher'), listMyBroadcasts);
router.delete('/messages/:id', requireAuth(), requireRole('teacher'), deleteMyBroadcast);

export default router;
