module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Permite exportar Hooks e Componentes no mesmo arquivo (padrão em Contexts)
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true, allowExportNames: ['useLayout', 'useAuth', 'useTheme', 'useChatLogic'] },
    ],
    
    // Transforma o erro de 'any' em um aviso silencioso (não quebra o build)
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Ignora variáveis não usadas se começarem com _
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    
    // Permite while(true) se necessário
    'no-constant-condition': ['warn', { 'checkLoops': false }],
  },
}