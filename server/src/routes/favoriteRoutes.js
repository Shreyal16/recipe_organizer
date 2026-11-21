import express from 'express';
import favoriteController from '../controllers/favoriteController.js';
import validate from '../middleware/validate.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { favoriteCreateZodSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', favoriteController.getFavorites);
router.post('/', validate({ body: favoriteCreateZodSchema }), favoriteController.addFavorite);
router.delete('/:recipeId', validateObjectId('recipeId'), favoriteController.removeFavorite);

export default router;
