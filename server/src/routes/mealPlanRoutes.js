import express from 'express';
import mealPlanController from '../controllers/mealPlanController.js';
import validate from '../middleware/validate.js';
import validateObjectId from '../middleware/validateObjectId.js';
import {
  mealPlanCreateZodSchema,
  mealPlanUpdateZodSchema,
} from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/:weekStart', mealPlanController.getMealPlanByWeek);
router.post('/', validate({ body: mealPlanCreateZodSchema }), mealPlanController.createMealPlan);
router.put('/:id', validateObjectId('id'), validate({ body: mealPlanUpdateZodSchema }), mealPlanController.updateMealPlan);
router.delete('/:id', validateObjectId('id'), mealPlanController.deleteMealPlan);

export default router;
