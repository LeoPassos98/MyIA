// frontend/src/services/userService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { api } from './api';

export const userService = {
  updateProfile: async (data: { name: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },
};
