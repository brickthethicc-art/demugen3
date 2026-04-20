import Fastify from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { createServerState } from './state/game-store.js';
import { setupGateway } from './gateway/websocket-gateway.js';
const DEFAULT_PORT = 3001;
export async function createServer(port = DEFAULT_PORT) {
    const fastify = Fastify({ logger: false });
    const io = new SocketServer(fastify.server, {
        cors: { origin: '*' },
    });
    const serverState = createServerState();
    setupGateway(io, serverState);
    fastify.get('/health', async () => ({ status: 'ok' }));
    await fastify.listen({ port, host: '0.0.0.0' });
    return { fastify, io, serverState, port };
}
export async function startServer() {
    const port = parseInt(process.env['PORT'] ?? String(DEFAULT_PORT), 10);
    const { fastify } = await createServer(port);
    console.log(`Mugen server running on port ${port}`);
    return fastify;
}
startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map