import express from 'express';
import recipeController from '../controllers/recipeController.js';
import validate from '../middleware/validate.js';
import validateObjectId from '../middleware/validateObjectId.js';
import {
  recipeCreateZodSchema,
  recipeUpdateZodSchema,
  recipeQueryZodSchema,
} from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', validate({ query: recipeQueryZodSchema }), recipeController.getRecipes);
router.get('/:id', validateObjectId('id'), recipeController.getRecipeById);
router.post('/', validate({ body: recipeCreateZodSchema }), recipeController.createRecipe);
router.put('/:id', validateObjectId('id'), validate({ body: recipeUpdateZodSchema }), recipeController.updateRecipe);
router.delete('/:id', validateObjectId('id'), recipeController.deleteRecipe);

export default router;
