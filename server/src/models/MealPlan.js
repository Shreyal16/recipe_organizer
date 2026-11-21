import mongoose from 'mongoose';

const mealEntrySchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: {
        values: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
        message: 'Meal type must be Breakfast, Lunch, Dinner, or Snack',
      },
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'Recipe ID reference is required for a meal entry'],
    },
    servings: {
      type: Number,
      required: [true, 'Servings number is required'],
      min: [1, 'Servings must be at least 1'],
      default: 1,
    },
  },
  { _id: true }
);

const dayPlanSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Day date is required'],
    },
    meals: {
      type: [mealEntrySchema],
      default: [],
    },
  },
  { _id: true }
);

const mealPlanSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date (Monday UTC) is required'],
      unique: true,
      index: true,
    },
    days: {
      type: [dayPlanSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const MealPlan = mongoose.models.MealPlan || mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;
