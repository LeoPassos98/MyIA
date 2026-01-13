// backend/src/types/express/index.d.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// Nós estamos dizendo ao TypeScript:
// "Ei, abra o namespace 'Express' e, dentro da interface 'Request',
// adicione esta propriedade opcional 'userId'."
declare global {
  namespace Express {
    interface Request {
      // Estamos dizendo ao TS que o middleware anexa o ID como uma string
      userId?: string; 
    }
  }
}

// O 'export {}' vazio é necessário para tratar este como um módulo.
export {};
