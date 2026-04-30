import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server as SocketServer } from 'socket.io';
import { createServerState } from './state/game-store.js';
import { setupGateway } from './gateway/websocket-gateway.js';
import { rateLimit } from './middleware/rate-limit.js';

const DEFAULT_PORT = 5174;
const CLIENT_DIST_PATH = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../client/dist');

function getCorsOrigins(): string | string[] {
  const allowedOrigins = process.env['CORS_ALLOWED_ORIGINS'];
  if (!allowedOrigins) {
    // Development: allow all origins
    return '*';
  }
  // Production: use specific origins
  return allowedOrigins.split(',').map(origin => origin.trim());
}

export async function createServer(port: number = DEFAULT_PORT) {
  const fastify = Fastify({ 
    logger: process.env['NODE_ENV'] === 'production',
    trustProxy: true,
  });

  const io = new SocketServer(fastify.server, {
    cors: { 
      origin: getCorsOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    perMessageDeflate: false,
  });

  const serverState = createServerState();
  setupGateway(io, serverState);

  const shouldServeStatic = existsSync(CLIENT_DIST_PATH);

  if (shouldServeStatic) {
    await fastify.register(fastifyStatic, {
      root: CLIENT_DIST_PATH,
      prefix: '/',
      cacheControl: true,
      etag: true,
      lastModified: true,
      maxAge: 3600,
    });
  }

  // Apply rate limiting to HTTP routes
  if (process.env['NODE_ENV'] === 'production') {
    fastify.addHook('onRequest', rateLimit({
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    }));
  }

  
  fastify.get('/health', async () => ({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
  }));

  if (!shouldServeStatic) {
    fastify.get('/', async () => ({
      message: 'Mugen Game Server',
      status: 'running',
      endpoints: {
        health: '/health',
        websocket: '/socket.io/',
      },
      documentation: 'See DEPLOYMENT.md for setup instructions',
    }));
  }

  if (shouldServeStatic) {
    fastify.setNotFoundHandler(async (request, reply) => {
      const requestPath = request.url.split('?')[0] ?? request.url;
      const acceptsHtml = (request.headers.accept ?? '').includes('text/html');
      const hasFileExtension = requestPath.includes('.');
      const isSpaRoute =
        request.method === 'GET' &&
        acceptsHtml &&
        !hasFileExtension &&
        !request.url.startsWith('/health') &&
        !request.url.startsWith('/socket.io') &&
        !request.url.startsWith('/api/');

      if (!isSpaRoute) {
        reply.code(404).send({ error: 'Not found' });
        return;
      }

      return reply.sendFile('index.html');
    });
  }

  await fastify.listen({ port, host: '0.0.0.0' });

  return { fastify, io, serverState, port };
}

export async function startServer() {
  const port = parseInt(process.env['PORT'] ?? String(DEFAULT_PORT), 10);
  const server = await createServer(port);
  const { fastify, io } = server;

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    console.log(`${signal} received, shutting down server...`);
    try {
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
      await fastify.close();
      process.exit(0);
    } catch (error) {
      console.error('Graceful shutdown failed:', error);
      process.exit(1);
    }
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  console.log(`=== SERVER STARTED ===`);
  console.log(`Mugen server running on port ${port}`);
  console.log(`Binding: 0.0.0.0:${port}`);
  console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`CORS Origins: ${getCorsOrigins()}`);
  return fastify;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
