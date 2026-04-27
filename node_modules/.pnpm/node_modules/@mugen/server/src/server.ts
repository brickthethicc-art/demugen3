import Fastify from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { createServerState } from './state/game-store.js';
import { setupGateway } from './gateway/websocket-gateway.js';
import { rateLimit } from './middleware/rate-limit.js';

const DEFAULT_PORT = 5174;

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
  });

  const io = new SocketServer(fastify.server, {
    cors: { 
      origin: getCorsOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const serverState = createServerState();
  setupGateway(io, serverState);
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

  // Root route
  fastify.get('/', async () => ({
    message: 'Mugen Game Server',
    status: 'running',
    endpoints: {
      health: '/health',
      websocket: '/socket.io/',
    },
    documentation: 'See DEPLOYMENT.md for setup instructions',
  }));

  await fastify.listen({ port, host: '0.0.0.0' });

  return { fastify, io, serverState, port };
}

export async function startServer() {
  const port = parseInt(process.env['PORT'] ?? String(DEFAULT_PORT), 10);
  const { fastify } = await createServer(port);
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
