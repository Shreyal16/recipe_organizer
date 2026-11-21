import api from './api';

export const getGroceryList = async (weekStart) => {
  return await api.get(`/grocery-lists/${weekStart}`);
};

export const generateGroceryList = async (weekStartDate) => {
  return await api.post('/grocery-lists/generate', { weekStartDate });
};

export const updateGroceryList = async (id, data) => {
  return await api.put(`/grocery-lists/${id}`, data);
};

export const addGroceryItem = async (listId, itemData) => {
  return await api.post(`/grocery-lists/${listId}/items`, itemData);
};

export const patchGroceryItem = async (listId, itemId, updates) => {
  return await api.patch(`/grocery-lists/${listId}/items/${itemId}`, updates);
};

export const deleteGroceryItem = async (listId, itemId) => {
  return await api.delete(`/grocery-lists/${listId}/items/${itemId}`);
};

export default {
  getGroceryList,
  generateGroceryList,
  updateGroceryList,
  addGroceryItem,
  patchGroceryItem,
  deleteGroceryItem,
};
