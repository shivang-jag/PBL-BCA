import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      sub: user._id.toString(),
      userId: user._id.toString(),
      role: user.role,
    },
    secret,
    { expiresIn }
  );
}
