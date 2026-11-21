import api from './api';

export const getRecipes = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  const url = queryString ? `/recipes?${queryString}` : '/recipes';
  return await api.get(url);
};

export const getRecipe = async (id) => {
  return await api.get(`/recipes/${id}`);
};

export const createRecipe = async (recipeData) => {
  return await api.post('/recipes', recipeData);
};

export const updateRecipe = async (id, recipeData) => {
  return await api.put(`/recipes/${id}`, recipeData);
};

export const deleteRecipe = async (id) => {
  return await api.delete(`/recipes/${id}`);
};

export default {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
