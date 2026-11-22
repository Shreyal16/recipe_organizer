import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Middlewares
import apiLimiter from './middleware/rateLimiter.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';

// Route imports
import recipeRoutes from './routes/recipeRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';
import groceryListRoutes from './routes/groceryListRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';

const app = express();

// Trust Render's single reverse proxy hop for client IP resolution in express-rate-limit
app.set('trust proxy', 1);

// Security and standard middlewares
app.use(helmet());

// Strict CORS validation
let allowedOrigin = null;
if (process.env.NODE_ENV === 'production') {
  if (!process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN.trim() === '') {
    console.error('[CORS Configuration Error] CLIENT_ORIGIN environment variable is missing in production.');
  } else {
    try {
      allowedOrigin = new URL(process.env.CLIENT_ORIGIN.trim()).origin;
    } catch (err) {
      console.error(`[CORS Configuration Error] CLIENT_ORIGIN "${process.env.CLIENT_ORIGIN}" is not a valid URL:`, err.message);
      allowedOrigin = null; // Malformed origin will be rejected
    }
  }
} else {
  // Development default
  try {
    allowedOrigin = new URL(process.env.CLIENT_ORIGIN || 'http://localhost:5173').origin;
  } catch {
    allowedOrigin = 'http://localhost:5173';
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, server-to-server, or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigin && origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}. Configured allowed origin: ${allowedOrigin || 'none'}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all /api routes (active in production: 300 req / 15 min)
app.use('/api', apiLimiter);

// 1. Process Liveness Check: returns 200 as long as the Express process is active
const livenessHandler = (req, res) => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = readyStates[mongoose.connection.readyState] || 'unknown';
  const isDbConnected = mongoose.connection.readyState === 1;

  return sendSuccess(
    res,
    {
      status: 'ok',
      service: 'recipe-organizer-server',
      uptime: Math.floor(process.uptime()),
      database: {
        connected: isDbConnected,
        state,
      },
      timestamp: new Date().toISOString(),
    },
    null,
    200
  );
};
app.get('/api/health', livenessHandler);
app.get('/health', livenessHandler);

// 2. Database Readiness Check: returns 200 only if MongoDB is connected and admin ping succeeds; otherwise 503
const readinessHandler = async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return sendError(
      res,
      'Database readiness probe failed: MongoDB is disconnected',
      503,
      'DATABASE_DISCONNECTED',
      { readyState: mongoose.connection.readyState }
    );
  }

  try {
    // Perform real admin ping against Atlas database
    await mongoose.connection.db.admin().ping();
    return sendSuccess(
      res,
      {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      null,
      200
    );
  } catch (err) {
    return sendError(
      res,
      `Database readiness probe failed: ${err.message}`,
      503,
      'DATABASE_PING_FAILED',
      { error: err.message }
    );
  }
};
app.get('/api/health/ready', readinessHandler);
app.get('/health/ready', readinessHandler);

// Domain API routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/insights', insightsRoutes);

// 404 Catch-all handler
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
