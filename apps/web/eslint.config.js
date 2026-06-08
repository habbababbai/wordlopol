import { createReactTypecheckedConfig } from '@wordlopol/eslint-config/react-typechecked';

export default [
  ...createReactTypecheckedConfig(import.meta.dirname),
  {
    files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/api/client',
              message: 'Use hooks in hooks/queries or hooks/mutations instead.',
            },
          ],
        },
      ],
    },
  },
];
