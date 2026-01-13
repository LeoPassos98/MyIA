// frontend/src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor de Requisição: injeta o token sempre que existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Loga o token para todas as requests protegidas (exceto login/register)
    if (config.url && !config.url.includes('/login') && !config.url.includes('/register')) {
      console.log(`[API Request] URL: ${config.url} | Token existe? ${!!token} | Token:`, token);
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔍 O Pulo do Gato: Interceptor de Resposta
api.interceptors.response.use(
  (response) => {
    // Se a resposta vier no padrão JSend com status 'success'
    if (response.data && response.data.status === 'success') {
      // 🪄 "Desembrulhamos" o pacote aqui. 
      // O que era response.data.data vira apenas response.data para o resto do app.
      return {
        ...response,
        data: response.data.data
      };
    }
    return response;
  },
  (error) => {
    // Tratamento global de erros JSend (fail ou error)
    const jsendError = error.response?.data;
    
    if (jsendError) {
      // Se for um 'fail', a mensagem costuma estar em data.message
      // Se for um 'error', a mensagem está em message
      const message = jsendError.data?.message || jsendError.message || 'Erro inesperado';
      
      // Podemos customizar o erro que o catch do componente vai receber
      error.message = message;
    }

    // Se for 401 (Não autorizado), poderíamos deslogar o usuário aqui
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Opcional: força redirecionamento
    }

    return Promise.reject(error);
  }
);