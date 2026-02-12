import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
	createTeacher,
	getTeamDetails,
	listAllMessages,
	listAllTeams,
	listAllTeachers,
	migrateMessageSenders,
	migrateTeamStatuses,
	syncMentors,
} from '../controllers/adminController.js';

const router = Router();

router.get('/teams', requireAuth(), requireRole('admin'), listAllTeams);
router.get('/messages', requireAuth(), requireRole('admin'), listAllMessages);
router.post('/migrate-messages', requireAuth(), requireRole('admin'), migrateMessageSenders);
router.get('/teachers', requireAuth(), requireRole('admin'), listAllTeachers);
router.post('/teachers', requireAuth(), requireRole('admin'), createTeacher);
router.post('/migrate-statuses', requireAuth(), requireRole('admin'), migrateTeamStatuses);
router.get('/team/:id', requireAuth(), requireRole('admin'), getTeamDetails);
router.post('/sync-mentors', requireAuth(), requireRole('admin'), syncMentors);

export default router;
