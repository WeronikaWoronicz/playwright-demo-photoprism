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
      ...playwright.configs['flat/recommended'].rules,
      '@typescript-eslint/no-floating-promises': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
    },
  },
  {
    ignores: ['**/node_modules/**', 'sut/**'],
  },
];
