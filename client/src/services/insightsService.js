import api from './api';

export const getInsights = async () => {
  return await api.get('/insights');
};

export default {
  getInsights,
};
