import mongoose from 'mongoose';

const groceryItemSchema = new mongoose.Schema(
  {
    ingredientName: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: null,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Pantry & General',
      trim: true,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true, // Guarantees a stable MongoDB ObjectId for each grocery item
  }
);

const groceryListSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [groceryItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const GroceryList = mongoose.models.GroceryList || mongoose.model('GroceryList', groceryListSchema);

export default GroceryList;
