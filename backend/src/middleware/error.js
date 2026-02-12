export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  // eslint-disable-next-line no-console
  console.error(err);

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err?.message || 'Server error';
  res.status(statusCode).json({ message });
}
