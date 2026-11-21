import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    profileKey: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
      trim: true,
    },
    preferredCuisines: {
      type: [String],
      default: [],
    },
    dietaryPreferences: {
      type: [String],
      default: [],
    },
    pantryIngredients: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const UserPreference = mongoose.models.UserPreference || mongoose.model('UserPreference', userPreferenceSchema);

export default UserPreference;
