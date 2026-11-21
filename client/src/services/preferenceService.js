import api from './api';

export const getPreferences = async () => {
  return await api.get('/preferences');
};

export const updatePreferences = async (preferenceData) => {
  return await api.put('/preferences', preferenceData);
};

export default {
  getPreferences,
  updatePreferences,
};
