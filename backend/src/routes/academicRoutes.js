import { Router } from 'express';
import { listSubjects, listYears } from '../controllers/academicController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/years', requireAuth(), listYears);
router.get('/subjects', requireAuth(), listSubjects);

export default router;
