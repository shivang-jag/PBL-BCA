import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listMyMessages } from '../controllers/studentController.js';

const router = Router();

router.get('/messages', requireAuth(), requireRole('student'), listMyMessages);

export default router;
