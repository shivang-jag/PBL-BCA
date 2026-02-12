import http from 'http';
import app from './app.js';
import { connectDb } from './config/db.js';

const PORT = process.env.PORT || 5000;

try {
  await connectDb();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Failed to connect to database', err);
  process.exit(1);
}

const server = http.createServer(app);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
