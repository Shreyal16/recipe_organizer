import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from process.cwd() or fallback to server/.env relative to this file
dotenv.config();
if (!process.env.MONGODB_URI) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // 1. Establish database connection before accepting traffic
    await connectDB();

    // 2. Start HTTP listener
    server = app.listen(PORT, () => {
      console.log(`[Server] Express listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Startup Aborted] Failed to start server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Commencing graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP listener closed');
      await disconnectDB();
      console.log('[Server] Graceful shutdown completed');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();

export default server;
