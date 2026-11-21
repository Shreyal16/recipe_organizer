import api from './api';

export const getMealPlan = async (weekStart) => {
  return await api.get(`/meal-plans/${weekStart}`);
};

export const createMealPlan = async (mealPlanData) => {
  return await api.post('/meal-plans', mealPlanData);
};

export const updateMealPlan = async (id, mealPlanData) => {
  return await api.put(`/meal-plans/${id}`, mealPlanData);
};

export const deleteMealPlan = async (id) => {
  return await api.delete(`/meal-plans/${id}`);
};

export default {
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
};
