import { api } from './api';

export const userService = {
  updateProfile: async (data: { name: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },
};
