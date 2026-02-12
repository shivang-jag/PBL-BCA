import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

import { timingSafeEqual } from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function getEnv(name) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : null;
}

function ensureRoleIsAllowed(role) {
  return role === 'student' || role === 'teacher' || role === 'admin';
}

function userDto(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function safeCompare(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length === 0 || bBuf.length === 0) return false;
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

async function findOrCreateUser({ email, name, role }) {
  if (!ensureRoleIsAllowed(role)) throw new Error('Invalid role');

  const safeEmail = normalizeEmail(email);
  const safeName = (typeof name === 'string' && name.trim()) || (role === 'student' ? 'Student' : role);

  const existing = await User.findOne({ email: safeEmail }).lean();
  if (existing && existing.role !== role) {
    const err = new Error('Role mismatch');
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findOneAndUpdate(
    { email: safeEmail },
    {
      $setOnInsert: {
        email: safeEmail,
        name: safeName.trim(),
        role,
      },
    },
    { upsert: true, new: true }
  );

  // Keep name fresh if Google provides a better one.
  if (user && typeof name === 'string' && name.trim() && user.name !== name.trim()) {
    user.name = name.trim();
    await user.save();
  }

  return user;
}

async function requireExistingUser({ email, role }) {
  if (!ensureRoleIsAllowed(role)) throw new Error('Invalid role');

  const existing = await User.findOne({ email });
  if (!existing) {
    return null;
  }
  if (existing.role !== role) {
    const err = new Error('Role mismatch');
    err.statusCode = 403;
    throw err;
  }
  return existing;
}

function getGoogleClient() {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  if (!clientId) return null;
  return new OAuth2Client(clientId);
}

export async function googleLogin(req, res) {
  const credential = req.body?.credential;
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ message: 'credential is required' });
  }

  const client = getGoogleClient();
  if (!client) return res.status(500).json({ message: 'Missing GOOGLE_CLIENT_ID on server' });

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: getEnv('GOOGLE_CLIENT_ID') });
    payload = ticket.getPayload();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(401).json({ message: 'Invalid Google token' });
  }

  if (!payload) return res.status(401).json({ message: 'Invalid Google token' });

  const email = normalizeEmail(payload?.email);
  const name = typeof payload?.name === 'string' ? payload.name.trim() : 'Student';

  if (!email) return res.status(401).json({ message: 'Google login failed' });
  if (payload?.email_verified === false) return res.status(401).json({ message: 'Email not verified' });

  try {
    const user = await findOrCreateUser({ email, name, role: 'student' });
    const token = signToken(user);
    return res.json({ token, user: userDto(user) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    const status = err?.statusCode || 500;
    if (status === 403) return res.status(403).json({ message: err.message || 'Forbidden' });
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function teacherLogin(req, res) {
  const email = normalizeEmail(req.body?.email);
  const secretCode = req.body?.secretCode;
  if (!email || !secretCode || typeof secretCode !== 'string') {
    return res.status(400).json({ message: 'email and secretCode are required' });
  }

  const teacherSecret = getEnv('TEACHER_SECRET');
  if (!teacherSecret) return res.status(500).json({ message: 'Missing TEACHER_SECRET on server' });

  if (!safeCompare(secretCode.trim(), teacherSecret)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await requireExistingUser({ email, role: 'teacher' });
    if (!user) return res.status(403).json({ message: 'Account not provisioned' });
    const token = signToken(user);
    return res.json({ token, user: userDto(user) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    const status = err?.statusCode || err?.status;
    if (status === 403) return res.status(403).json({ message: err.message || 'Forbidden' });
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function adminLogin(req, res) {
  const email = normalizeEmail(req.body?.email);
  const secretCode = req.body?.secretCode;
  if (!email || !secretCode || typeof secretCode !== 'string') {
    return res.status(400).json({ message: 'email and secretCode are required' });
  }

  const adminSecret = getEnv('ADMIN_SECRET');
  const teacherSecret = getEnv('TEACHER_SECRET');
  if (!adminSecret) return res.status(500).json({ message: 'Missing ADMIN_SECRET on server' });
  if (teacherSecret && adminSecret === teacherSecret) {
    return res.status(500).json({ message: 'Server misconfigured: ADMIN_SECRET must differ from TEACHER_SECRET' });
  }

  if (!safeCompare(secretCode.trim(), adminSecret)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await requireExistingUser({ email, role: 'admin' });
    if (!user) return res.status(403).json({ message: 'Account not provisioned' });
    const token = signToken(user);
    return res.json({ token, user: userDto(user) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    const status = err?.statusCode || err?.status;
    if (status === 403) return res.status(403).json({ message: err.message || 'Forbidden' });
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req, res) {
  // req.user is attached by requireAuth().
  const u = req.user;
  return res.json({ user: { id: u._id || u.id, name: u.name, email: u.email, role: u.role } });
}
