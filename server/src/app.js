import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Middlewares
import apiLimiter from './middleware/rateLimiter.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import { sendSuccess } from './utils/apiResponse.js';

// Route imports
import recipeRoutes from './routes/recipeRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';
import groceryListRoutes from './routes/groceryListRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';

const app = express();

// Security and standard middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Health check endpoint (both /api/health and /health for convenience)
const healthHandler = (req, res) => {
  const readyStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = readyStates[mongoose.connection.readyState] || 'unknown';
  const isDbConnected = mongoose.connection.readyState === 1;

  return sendSuccess(
    res,
    {
      status: 'ok',
      service: 'recipe-organizer-server',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        state,
      },
    },
    null,
    200
  );
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

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
