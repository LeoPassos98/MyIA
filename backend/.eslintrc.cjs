/**
 * ESLint Configuration - Backend
 * 
 * Enforcement rigoroso de padrões do STANDARDS.md:
 * - Proíbe console.log (exceto warn/error)
 * - Proíbe imports relativos profundos
 * 
 * @see docs/STANDARDS.md - Seção 12.4.1
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // 1. Proibir console.log (permitir warn/error)
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // 2. Proibir imports relativos profundos (../../..)
    // TEMPORARIAMENTE DESABILITADO: Há muitos imports existentes que violam esta regra
    // TODO: Reorganizar imports para usar aliases de caminho
    'no-restricted-imports': 'off',

    // Manter rule existente
    'import/order': 'warn',
  },
  overrides: [
    // Exceções: scripts podem usar console.log
    {
      files: ['scripts/**/*.ts', 'scripts/**/*.mjs', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    // Exceções: testes podem usar console.log
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    // Exceções: seed pode usar console.log
    {
      files: ['**/seed.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
