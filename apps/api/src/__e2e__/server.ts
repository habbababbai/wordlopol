import type { Server } from 'node:http';
import type { Express } from 'express';

let server: Server | undefined;

export let baseUrl = '';

export async function startE2eServer(): Promise<void> {
  if (server) {
    throw new Error('E2E server already running');
  }

  const { createApp } = await import('../app.js');
  const app: Express = createApp();

  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server?.address();

      if (address && typeof address === 'object') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }

      resolve();
    });

    server.on('error', (error) => {
      server = undefined;
      baseUrl = '';
      reject(error);
    });
  });
}

export async function stopE2eServer(): Promise<void> {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });

  server = undefined;
  baseUrl = '';
}
