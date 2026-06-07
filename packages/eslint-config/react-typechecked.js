import tseslint from 'typescript-eslint';
import react from './react.js';

const unsafeRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error',
};

/**
 * @param {string} tsconfigRootDir Absolute path to the app root (pass import.meta.dirname).
 */
export function createReactTypecheckedConfig(tsconfigRootDir) {
  return tseslint.config(
    ...react,
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    ...tseslint.configs.recommendedTypeChecked,
    {
      rules: unsafeRules,
    },
    {
      files: ['**/*.config.ts', 'vite.config.ts'],
      ...tseslint.configs.disableTypeChecked,
    },
    {
      ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'],
    },
  );
}
