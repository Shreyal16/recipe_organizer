import UserPreference from '../models/UserPreference.js';

export const getPreferences = async () => {
  let preference = await UserPreference.findOne({ profileKey: 'default' }).lean();
  if (!preference) {
    preference = await UserPreference.create({
      profileKey: 'default',
      preferredCuisines: ['Indian', 'Italian', 'Asian'],
      dietaryPreferences: ['Vegetarian'],
      pantryIngredients: ['onion', 'tomato', 'garlic', 'ginger', 'olive oil', 'salt'],
    });
  }
  return preference;
};

export const updatePreferences = async (updateData) => {
  const { preferredCuisines, dietaryPreferences, pantryIngredients } = updateData;

  const updated = await UserPreference.findOneAndUpdate(
    { profileKey: 'default' },
    {
      $set: {
        ...(preferredCuisines !== undefined && { preferredCuisines }),
        ...(dietaryPreferences !== undefined && { dietaryPreferences }),
        ...(pantryIngredients !== undefined && { pantryIngredients }),
      },
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return updated;
};

export default {
  getPreferences,
  updatePreferences,
};
