import mongoose from 'mongoose';

const ingredientSubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: null,
      min: [0, 'Ingredient quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const instructionSubSchema = new mongoose.Schema(
  {
    step: {
      type: Number,
      required: [true, 'Instruction step number is required'],
      min: [1, 'Step number must be at least 1'],
    },
    text: {
      type: String,
      required: [true, 'Instruction text is required'],
      trim: true,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      maxlength: [200, 'Recipe title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Recipe description is required'],
      trim: true,
      maxlength: [2000, 'Recipe description cannot exceed 2000 characters'],
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, 'Cuisine is required'],
      trim: true,
      index: true,
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      trim: true,
      index: true,
    },
    prepTimeMinutes: {
      type: Number,
      required: [true, 'Preparation time in minutes is required'],
      min: [0, 'Preparation time cannot be negative'],
      index: true,
    },
    cookTimeMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Cooking time cannot be negative'],
    },
    servings: {
      type: Number,
      required: [true, 'Servings number is required'],
      min: [1, 'Servings must be at least 1'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      default: 'Medium',
    },
    dietaryTags: {
      type: [String],
      default: [],
      index: true,
    },
    ingredients: {
      type: [ingredientSubSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A recipe must contain at least one ingredient',
      },
    },
    instructions: {
      type: [instructionSubSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A recipe must contain at least one instruction step',
      },
    },
    seasonalTags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching, filtering, and sorting
recipeSchema.index({ cuisine: 1, mealType: 1 });
recipeSchema.index({ prepTimeMinutes: 1, createdAt: -1 });
recipeSchema.index({ 'ingredients.name': 1 });

const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);

export default Recipe;
