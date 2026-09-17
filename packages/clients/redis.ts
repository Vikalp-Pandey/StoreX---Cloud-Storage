import { createClient } from 'redis';
import env from '@packages/env';

let client: ReturnType<typeof createClient> | null = null;
let connection: Promise<boolean> | null = null;
let retryAfter = 0;

export async function getRedisClient() {
  if (env.NODE_ENV === 'test' || Date.now() < retryAfter) return null;

  if (!client) {
    client = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 1_000,
        reconnectStrategy: false,
      },
    });
    client.on('error', () => {
      // Cache errors are handled by the wrappers; MongoDB stays authoritative.
    });
  }

  if (!client.isReady) {
    const pendingClient = client;
    connection ??= client
      .connect()
      .then(
        () => true,
        () => false,
      )
      .finally(() => {
        connection = null;
      });
    const connected = await connection;

    if (!connected || !pendingClient.isReady) {
      retryAfter = Date.now() + 5_000;
      if (pendingClient.isOpen) pendingClient.destroy();
      if (client === pendingClient) client = null;
      return null;
    }
  }

  return client;
}

export async function closeRedisClient() {
  if (client?.isOpen) await client.quit();
}
