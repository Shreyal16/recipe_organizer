import express from 'express';
import preferenceController from '../controllers/preferenceController.js';
import validate from '../middleware/validate.js';
import { preferenceUpdateZodSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', preferenceController.getPreferences);
router.put('/', validate({ body: preferenceUpdateZodSchema }), preferenceController.updatePreferences);

export default router;
