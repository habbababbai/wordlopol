import { afterAll, beforeAll } from 'vitest';
import { startE2eServer, stopE2eServer } from './server.js';

beforeAll(async () => {
  await startE2eServer();
}, 30_000);

afterAll(async () => {
  await stopE2eServer();
});
