import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import playwright from 'eslint-plugin-playwright'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
          parserOptions: {
            project: true,
          },
        },
    },
    playwright.configs['flat/recommended'],
    {
        rules: {
            semi: ["warn", "always"],
            "@typescript-eslint/no-floating- ": "error",    
        }, 
    }
  );
