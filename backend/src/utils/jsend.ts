// backend/src/utils/jsend.ts
// Helper para padronizar respostas no formato JSend

export const jsend = {
  /**
   * Resposta de sucesso (2xx)
   * @param data - Dados a serem retornados
   */
  success: (data: any) => ({
    status: 'success',
    data
  }),
  
  /**
   * Resposta de falha - erro do cliente (4xx)
   * @param data - Objeto com campos inválidos
   */
  fail: (data: any) => ({
    status: 'fail',
    data
  }),
  
  /**
   * Resposta de erro - erro do servidor (5xx)
   * @param message - Mensagem de erro
   * @param code - Código de erro opcional
   * @param data - Dados adicionais opcionais
   */
  error: (message: string, code?: number, data?: any) => ({
    status: 'error',
    message,
    ...(code && { code }),
    ...(data && { data })
  })
};
