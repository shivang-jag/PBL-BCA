import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env even if the process is started from repo root.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

if (process.env.NODE_ENV === 'production') {
	// When deployed behind a reverse proxy (Render/Nginx/etc.), this is needed for correct IP detection.
	app.set('trust proxy', 1);
}

app.use(
	helmet({
		// API server: allow cross-origin requests from the frontend via CORS.
		crossOriginResourcePolicy: { policy: 'cross-origin' },
	})
);

const apiLimiter = rateLimit({
	windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	max: Number(process.env.RATE_LIMIT_MAX || 300),
	standardHeaders: true,
	legacyHeaders: false,
});

const authLimiter = rateLimit({
	windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
	standardHeaders: true,
	legacyHeaders: false,
});

function normalizeOrigin(value) {
	const s = String(value || '').trim();
	if (!s) return '';
	return s.replace(/\/+$/, '');
}

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '')
	.split(',')
	.map(normalizeOrigin)
	.filter(Boolean);

if (!allowedOrigins.length && process.env.NODE_ENV !== 'production') {
	allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
	// eslint-disable-next-line no-console
	console.error('Missing ALLOWED_ORIGINS in production. Refusing to start to avoid blocking all CORS requests.');
	throw new Error('Missing ALLOWED_ORIGINS in production');
}

app.use(
	cors({
		origin(origin, callback) {
			// Allow requests without an Origin header (e.g., curl, server-to-server).
			if (!origin) return callback(null, true);
			const normalized = normalizeOrigin(origin);
			if (allowedOrigins.includes(normalized)) return callback(null, true);
			return callback(null, false);
		},
	})
);
app.use(express.json({ limit: '1mb' }));

app.use(apiLimiter);

const shouldHttpLog = process.env.NODE_ENV !== 'production' || String(process.env.HTTP_LOG || '') === '1';
if (shouldHttpLog) {
	app.use(
		morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
			skip(req) {
				return req.path === '/health';
			},
		})
	);
}

app.get('/health', (req, res) => res.json({ ok: true }));

// Friendly root response for platform probes / users opening the service URL.
app.get('/', (req, res) => {
	res.json({ ok: true, service: 'pbl-bca-backend', health: '/health', apiBase: '/api' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', academicRoutes);
app.use('/api', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

