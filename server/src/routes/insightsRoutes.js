import express from 'express';
import insightsController from '../controllers/insightsController.js';

const router = express.Router();

router.get('/', insightsController.getInsights);

export default router;
