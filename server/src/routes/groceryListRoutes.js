import express from 'express';
import groceryListController from '../controllers/groceryListController.js';
import validate from '../middleware/validate.js';
import validateObjectId from '../middleware/validateObjectId.js';
import {
  groceryGenerateZodSchema,
  groceryItemCreateZodSchema,
  groceryItemPatchZodSchema,
} from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/:weekStart', groceryListController.getGroceryListByWeek);
router.post('/generate', validate({ body: groceryGenerateZodSchema }), groceryListController.generateGroceryList);
router.put('/:id', validateObjectId('id'), groceryListController.updateGroceryList);
router.post('/:id/items', validateObjectId('id'), validate({ body: groceryItemCreateZodSchema }), groceryListController.addGroceryItem);
router.patch('/:id/items/:itemId', validateObjectId('id'), validateObjectId('itemId'), validate({ body: groceryItemPatchZodSchema }), groceryListController.patchGroceryItem);
router.delete('/:id/items/:itemId', validateObjectId('id'), validateObjectId('itemId'), groceryListController.deleteGroceryItem);

export default router;
