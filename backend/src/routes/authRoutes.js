import { Router } from 'express';
import { adminLogin, googleLogin, me, teacherLogin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/google-login', googleLogin);
router.post('/teacher-login', teacherLogin);
router.post('/admin-login', adminLogin);
router.get('/me', requireAuth(), me);

export default router;
