import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      playwright,
    },
    rules: {
      semi: ['warn', 'always'],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    ignores: ['**/node_modules/**'],
  },
];
