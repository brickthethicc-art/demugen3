# Single Render Deployment Consolidation

## Problem Summary
Currently, the demugen3 project is configured for two separate Render deployments: a web service for the backend (Node.js + Fastify + Socket.IO) and a static site for the frontend (React + Phaser built with Vite). This requires managing two services, two domains, and cross-origin configuration. For a simpler deployment model and to stay within Render's free tier limits, the project should be consolidated into a single deployment that serves both the frontend static files and backend API/WebSocket from the same service.

## Desired Behavior
The project should deploy as a single Render web service that:
1. Builds both the backend and frontend during the build step
2. Serves the frontend static files from Fastify using `@fastify/static`
3. Handles WebSocket connections at `/socket.io/`
4. Serves API routes (like `/health`) alongside static files
5. Requires only one domain and one service to manage
6. Works with the existing pnpm workspace structure

## Current State
- `render.yaml` defines two separate services (web service + static site)
- Frontend is built separately and deployed as a static site
- Backend is deployed as a web service with Socket.IO
- Frontend uses Vite with proxy configuration for development
- No static file serving configured in Fastify
- Frontend expects backend at a separate origin (VITE_SERVER_URL env var)
- `packages/server/package.json` start script uses `tsx src/server.ts`
- `packages/client/vite.config.ts` has dev proxy configuration

## Key Files to Investigate

### 1. Render Blueprint
**File**: `render.yaml` (root)
- Currently defines two services
- Needs to be simplified to one web service
- Build command needs to build both packages
- Start command runs the backend server

### 2. Server Entry Point
**File**: `packages/server/src/server.ts`
- Currently only handles API/WebSocket routes
- Needs to add static file serving with `@fastify/static`
- Needs to serve frontend at root path `/`
- Needs to configure fallback to index.html for SPA routing

### 3. Server Dependencies
**File**: `packages/server/package.json`
- Needs to add `@fastify/static` dependency
- Start script may need adjustment
- Build script should remain (tsc for type checking)

### 4. Client Vite Configuration
**File**: `packages/client/vite.config.ts`
- Currently has dev proxy configuration
- May need base path configuration if serving from subdirectory
- Build output goes to `dist/` directory
- Should work with root serving (no subdirectory needed)

### 5. Environment Variables
**File**: `.env.production` and Render env vars
- Currently uses `VITE_SERVER_URL` for cross-origin requests
- With single deployment, frontend can use relative paths
- May need to simplify or remove `VITE_SERVER_URL`
- `CORS_ALLOWED_ORIGINS` can be simplified to same origin

### 6. Client Socket.IO Configuration
**File**: Need to locate Socket.IO client initialization (likely in `packages/client/src/`)
- Currently connects to absolute URL from `VITE_SERVER_URL`
- Should connect to relative path `/socket.io/` or window.location origin
- May need to update connection logic

## Implementation Approach

### Option 1: Serve Frontend from Root, API/WebSocket at Paths
Serve the frontend static files from the root path `/`, with API and WebSocket at specific paths:
- Frontend static files served at `/` (index.html, assets, etc.)
- WebSocket endpoint at `/socket.io/`
- Health check at `/health`
- No subdirectory needed for frontend

### Option 2: Serve Frontend from Subdirectory
Serve frontend from a subdirectory like `/app/`:
- Frontend at `/app/`
- API/WebSocket at root level paths
- Requires Vite base configuration
- More complex routing

**Recommendation**: Use Option 1 for simplicity.

## Required Changes

### 1. Add @fastify/static Dependency
Add the Fastify static file serving plugin to server dependencies:

```json
// packages/server/package.json
"dependencies": {
  "@mugen/shared": "workspace:*",
  "fastify": "^4.28.0",
  "socket.io": "^4.7.0",
  "@fastify/cors": "^9.0.0",
  "@fastify/static": "^6.0.0"  // Add this
}
```

### 2. Update Server to Serve Static Files
Modify `packages/server/src/server.ts` to serve frontend static files:

```typescript
import fastifyStatic from '@fastify/static';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function createServer(port: number = DEFAULT_PORT) {
  const fastify = Fastify({ 
    logger: process.env['NODE_ENV'] === 'production',
    trustProxy: true,
  });

  // Register static file serving
  await fastify.register(fastifyStatic, {
    root: resolve(__dirname, '../../client/dist'),
    prefix: '/', // Serve from root
  });

  // Fallback to index.html for SPA routing
  fastify.setNotFoundHandler(async (request, reply) => {
    // Don't fallback for API/WebSocket routes
    if (request.url.startsWith('/socket.io/') || 
        request.url.startsWith('/health') ||
        request.url.startsWith('/api')) {
      reply.code(404).send({ error: 'Not found' });
      return;
    }
    return reply.sendFile('index.html');
  });

  // ... rest of existing server setup
}
```

### 3. Update Render Blueprint to Single Service
Replace `render.yaml` with a single web service:

```yaml
services:
  - type: web
    name: demugen3
    runtime: node
    plan: free
    buildCommand: pnpm install --frozen-lockfile && pnpm --filter @mugen/client build
    startCommand: pnpm --filter @mugen/server exec tsx src/server.ts
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_OPTIONS
        value: --max-old-space-size=384
      - key: CORS_ALLOWED_ORIGINS
        value: https://demugen3.onrender.com,https://www.demugen3.onrender.com
```

### 4. Update Client Socket.IO Connection
Find and update the Socket.IO client initialization to use relative path:

```typescript
// Find in packages/client/src/ (likely in a hook or store)
// Before:
const socket = io(VITE_SERVER_URL, {
  // options
});

// After:
const socket = io({
  path: '/socket.io/',
  // options
});
// Or simply:
const socket = io(); // Uses current origin
```

### 5. Simplify Environment Variables
Update `.env.production` to remove or simplify cross-origin config:

```dotenv
# Production Environment Configuration
NODE_ENV=production
PORT=5174
NODE_OPTIONS=--max-old-space-size=384

# No longer needed with single deployment:
# VITE_SERVER_URL=https://your-domain.com

# CORS can be simplified to same origin:
CORS_ALLOWED_ORIGINS=https://demugen3.onrender.com,https://www.demugen3.onrender.com
```

### 6. Update Client Vite Config (if needed)
The Vite config may not need changes if serving from root. Verify:

```typescript
// packages/client/vite.config.ts
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    envDir: '../../',
    base: '/', // Explicitly set to root (default)
    // ... rest of config
  };
});
```

## Implementation Details

### Static File Serving
- Use `@fastify/static` plugin for efficient static file serving
- Serve from `packages/client/dist` directory
- Set cache headers for production (1 year for hashed assets, short for index.html)
- Handle SPA routing with fallback to index.html

### Build Process
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @mugen/client build`
- This builds the client first, then the server starts and serves the built files
- No need to build server (using tsx for direct execution)
- Ensure pnpm workspace installs dependencies correctly

### WebSocket Configuration
- Socket.IO continues to work at `/socket.io/` path
- No changes needed to Socket.IO server configuration
- Client should connect to relative path or same origin
- CORS configuration can be simplified to same origin

### CORS Configuration
- With single deployment, frontend and backend share the same origin
- `CORS_ALLOWED_ORIGINS` can be set to the Render domain(s)
- Can also set to same-origin pattern if desired
- Credentials setting can remain true

### Environment Variables
- Remove `VITE_SERVER_URL` if no longer needed
- Simplify `CORS_ALLOWED_ORIGINS` to single domain
- Keep `NODE_OPTIONS` for memory tuning
- Keep `NODE_ENV=production`

### Health Check
- `/health` endpoint continues to work
- Render uses this for service health monitoring
- No changes needed to health check implementation

### Development Mode
- Development mode can continue using Vite dev server with proxy
- No changes needed to local development workflow
- Single deployment only affects production

## Testing Strategy

### 1. Local Build Test
- Run build command locally: `pnpm install --frozen-lockfile && pnpm --filter @mugen/client build`
- Verify `packages/client/dist` is created with all assets
- Verify server can start and serve static files

### 2. Static File Serving Test
- Start server locally
- Access root path `/` in browser
- **Expected**: Frontend loads (index.html served)
- **Expected**: Assets load correctly (JS, CSS, images)
- **Expected**: No 404 errors for static assets

### 3. SPA Routing Test
- Navigate to a client-side route (e.g., `/game/123`)
- Refresh the page
- **Expected**: Index.html is served (fallback works)
- **Expected**: Client-side routing handles the route
- **Expected**: No 404 from server

### 4. WebSocket Connection Test
- Start server locally
- Connect from frontend
- **Expected**: Socket.IO connects successfully
- **Expected**: WebSocket endpoint at `/socket.io/` works
- **Expected**: Game state updates work

### 5. API Endpoint Test
- Access `/health` endpoint
- **Expected**: Returns health check JSON
- **Expected**: No conflict with static file serving

### 6. Production Deployment Test
- Deploy to Render using updated blueprint
- Verify service starts successfully
- **Expected**: Frontend loads at Render URL
- **Expected**: WebSocket connections work
- **Expected**: Health check passes
- **Expected**: No CORS errors

### 7. Environment Variable Test
- Verify frontend doesn't rely on `VITE_SERVER_URL`
- Verify CORS allows same origin
- **Expected**: No cross-origin errors in browser console

## Verification Steps

### Build Verification
1. Run `pnpm install --frozen-lockfile && pnpm --filter @mugen/client build`
2. **Expected**: Client builds successfully to `packages/client/dist`
3. **Expected**: All assets are present (index.html, JS, CSS, etc.)
4. **Expected**: No build errors

### Local Server Verification
1. Start server: `pnpm --filter @mugen/server exec tsx src/server.ts`
2. Open browser to `http://localhost:5174`
3. **Expected**: Frontend loads and displays
4. **Expected**: No 404 errors in console
5. **Expected**: Static assets load correctly
6. Navigate to a route and refresh
7. **Expected**: Page loads correctly (SPA fallback works)

### WebSocket Verification
1. Start a game or trigger Socket.IO connection
2. **Expected**: Connection establishes successfully
3. **Expected**: Real-time updates work
4. **Expected**: No CORS errors

### Render Deployment Verification
1. Push updated `render.yaml` to repository
2. Deploy to Render (or update existing service)
3. **Expected**: Build completes successfully
4. **Expected**: Service starts and health check passes
5. Open deployed URL in browser
6. **Expected**: Frontend loads
7. **Expected**: Game functionality works
8. **Expected**: WebSocket connections work

### CORS Verification
1. Check browser console for CORS errors
2. **Expected**: No CORS errors
3. **Expected**: All requests succeed

## Additional Considerations

### Asset Caching
- Configure appropriate cache headers for static assets
- Hashed assets (JS, CSS) can have long cache (1 year)
- index.html should have short cache or no-cache
- Use `@fastify/static` cache options:

```typescript
await fastify.register(fastifyStatic, {
  root: resolve(__dirname, '../../client/dist'),
  prefix: '/',
  cacheControl: true,
  maxAge: 3600, // 1 hour default, override per file type
  etag: true,
  lastModified: true,
});
```

### Security
- Ensure static file serving doesn't expose sensitive files
- Only serve from the dist directory
- Don't serve source maps in production (already disabled in vite.config.ts)
- Keep CORS configuration secure (explicit origins)

### Performance
- Static file serving is efficient with `@fastify/static`
- Gzip compression can be enabled (consider adding @fastify/compress)
- CDN not needed for Render free tier (serves from origin)
- Consider asset optimization in Vite build

### Development vs Production
- Development mode unchanged (Vite dev server with proxy)
- Production mode uses single deployment
- No impact on local development workflow
- Can test production build locally before deploying

### Rollback Plan
- Keep previous `render.yaml` as backup
- Can revert to two-service deployment if needed
- Git history allows easy rollback
- Document the change for future reference

### Free Tier Constraints
- Single service fits within Render free tier
- 512MB memory limit still applies
- Build time may be longer (building both packages)
- Consider build optimization if needed

### Domain Configuration
- Single domain for both frontend and backend
- No need for subdomain configuration
- SSL handled automatically by Render
- Custom domain can be added if desired

## Related Files
- `render.yaml` (root - update to single service)
- `packages/server/src/server.ts` (add static file serving)
- `packages/server/package.json` (add @fastify/static dependency)
- `packages/client/vite.config.ts` (verify base path configuration)
- `.env.production` (simplify environment variables)
- Socket.IO client initialization (need to locate - likely in `packages/client/src/`)
- `packages/client/src/store/` or `packages/client/src/hooks/` (Socket.IO connection logic)

## Context
This change consolidates the demugen3 project from two separate Render deployments (backend web service + frontend static site) into a single deployment. The backend server will serve the frontend static files using `@fastify/static`, with the frontend accessible at the root path and WebSocket/API at specific paths. This simplifies deployment, reduces management overhead, and fits within Render's free tier constraints. The frontend will connect to the backend using relative paths instead of a separate origin, eliminating cross-origin complexity. Local development remains unchanged with Vite dev server and proxy configuration.
