import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'e2e',
    environment: 'node',
    globalSetup: ['./src/test/global-setup.ts'],
    setupFiles: ['./src/test/setup.ts', './src/__e2e__/setup.ts'],
    include: ['src/__e2e__/**/*.e2e.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
