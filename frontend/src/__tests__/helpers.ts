/**
 * Helpers de teste para React Query e testes assíncronos
 */

/**
 * Aguarda todas as promises pendentes serem resolvidas
 * Útil para testes com React Query
 */
export const flushPromises = () => 
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Aguarda a próxima atualização de estado/query
 * Combina flushPromises com um delay adicional para garantir
 * que React Query tenha tempo de processar
 */
export const waitForNextUpdate = async () => {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 100));
};

/**
 * Aguarda múltiplas atualizações
 * @param count Número de atualizações para aguardar
 */
export const waitForUpdates = async (count: number = 1) => {
  for (let i = 0; i < count; i++) {
    await waitForNextUpdate();
  }
};
