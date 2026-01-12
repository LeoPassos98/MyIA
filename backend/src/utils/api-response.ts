// backend/src/utils/api-response.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

export type JSendStatus = 'success' | 'fail' | 'error';

export class ApiResponse {
  // Para 200 OK, 201 Created
  static success(data: any = null) {
    return {
      status: 'success' as JSendStatus,
      data
    };
  }

  // Para erros de validação ou regras de negócio (400, 403)
  static fail(data: any) {
    return {
      status: 'fail' as JSendStatus,
      data // Geralmente um objeto com os campos que falharam
    };
  }

  // Para erros catastróficos ou de servidor (500)
  static error(message: string, code?: number, data?: any) {
    return {
      status: 'error' as JSendStatus,
      message,
      ...(code && { code }),
      ...(data && { data })
    };
  }
}
