import api from './api';

export const getFavorites = async () => {
  return await api.get('/favorites');
};

export const addFavorite = async (recipeId) => {
  return await api.post('/favorites', { recipeId });
};

export const removeFavorite = async (recipeId) => {
  return await api.delete(`/favorites/${recipeId}`);
};

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
};
