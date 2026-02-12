import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

function getTokenFromHeader(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

export function requireAuth() {
  return async (req, res, next) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // eslint-disable-next-line no-console
      console.error('Missing JWT_SECRET');
      return res.status(500).json({ message: 'Server misconfigured' });
    }

    try {
      const token = getTokenFromHeader(req);
      if (!token) return res.status(401).json({ message: 'Missing auth token' });

      const payload = jwt.verify(token, secret);
      const userId = payload?.userId || payload?.sub;
      const role = payload?.role;

      if (!userId || !role) return res.status(401).json({ message: 'Invalid token' });

      const user = await User.findById(userId).lean();
      if (!user) return res.status(401).json({ message: 'Invalid token' });

      // Prevent tampering / manual role switching.
      if (user.role !== role) return res.status(401).json({ message: 'Invalid token' });

      req.user = user;
      return next();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

export function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allow.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}
