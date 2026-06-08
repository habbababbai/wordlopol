import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    environment: 'node',
    globalSetup: ['./src/test/global-setup.ts'],
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['src/__e2e__/**'],
    fileParallelism: false,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.e2e.ts',
        'src/__tests__/**',
        'src/__e2e__/**',
        'src/test/**',
        'src/generated/**',
        'src/types/**',
      ],
    },
  },
});
