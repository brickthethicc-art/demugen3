# Network Fix Summary - Cross-Network Multiplayer on Port 5174

## Changes Made

### 1. Server Configuration (`packages/server/src/server.ts`)
- **Changed default port**: 3001 → 5174
- **Binding**: Already correctly set to `0.0.0.0` (accepts external connections)
- **Added enhanced logging**: Server startup now logs binding address, port, environment, and CORS origins

### 2. Environment Configuration

#### `.env.development`
```
PORT=5174
VITE_SERVER_URL=http://192.168.0.103:5174
CORS_ALLOWED_ORIGINS=*
```

#### `.env.production`
```
PORT=5174
CORS_ALLOWED_ORIGINS=*
```

### 3. Client Configuration (`packages/client/src/network/socket-client.ts`)
- **Added WebSocket transport enforcement**: `transports: ['websocket']`
  - This fixes the "xhr poll error" by forcing WebSocket instead of polling
- **Added reconnection settings**: 5 attempts with 1000ms delay
- **Enhanced logging**: Transport type, connection URL, disconnect reasons, error details

### 4. Server Gateway (`packages/server/src/gateway/websocket-gateway.ts`)
- **Added connection logging**: Client IP, transport type, player count
- **Added lobby operation logging**: create_lobby, join_lobby attempts and results
- **Added disconnect logging**: Disconnect reasons for debugging

### 5. Client UI (`packages/client/src/components/LobbyScreen.tsx`)
- **Updated fallback URLs**: Changed from `http://localhost:3001` to `http://192.168.0.103:5174`
- This ensures clients connect to the server IP even if env var is not set

## Port Forwarding Configuration (MANDATORY)

Your router must be configured as follows:

### Router Settings
- **Service Name**: emugen
- **Internal IP Address**: 192.168.0.103
- **External Port**: 5174
- **Internal Port**: 5174
- **Protocol**: TCP

### Flow
```
External Client → Router (Port 5174 TCP) → 192.168.0.103:5174 → Server (0.0.0.0:5174)
```

## Testing Steps

### 1. Local Testing (Same Network)
1. Start the server: `cd packages/server && npm run dev`
2. Verify server logs show:
   ```
   === SERVER STARTED ===
   Mugen server running on port 5174
   Binding: 0.0.0.0:5174
   Environment: development
   CORS Origins: *
   ```
3. Start the client: `cd packages/client && npm run dev`
4. Open browser to client URL
5. Try creating a lobby - should succeed without "xhr poll error"
6. Check browser console for transport type: should show "websocket"

### 2. Cross-Network Testing (After Port Forwarding)
1. Configure port forwarding on router as specified above
2. Start server on host machine (192.168.0.103)
3. On a different device (external to your network):
   - Open browser to your client URL
   - Or modify client to connect via public IP: `http://<PUBLIC_IP>:5174`
4. Try creating/joining lobbies
5. Check server logs for external client IP connections

### 3. Debug Logging

**Server logs will show:**
```
=== DEBUG: WebSocket Connection ===
Player connected: <socket-id>
Client IP: <client-ip-address>
Transport type: websocket
Total connected players: 1

=== DEBUG: create_lobby ===
Player ID: <socket-id>
Lobby name: <name>
Lobby created successfully. Code: <code>
```

**Client console will show:**
```
=== SOCKET CONNECTED ===
Socket ID: <socket-id>
Transport: websocket
Connected to URL: http://192.168.0.103:5174
```

## Troubleshooting

### "xhr poll error" persists
- **Cause**: WebSocket transport not enforced
- **Fix**: Check `socket-client.ts` has `transports: ['websocket']`
- **Alternative**: If WebSocket fails, remove transport restriction to allow fallback

### Clients cannot connect externally
- **Check 1**: Verify server is binding to `0.0.0.0:5174` (not localhost)
- **Check 2**: Verify port forwarding is configured correctly
- **Check 3**: Verify firewall allows inbound TCP on port 5174
- **Check 4**: Test external port accessibility: `telnet <public-ip> 5174`

### CORS errors
- **Check**: `CORS_ALLOWED_ORIGINS` is set to `*` in environment
- **Check**: Server logs show correct CORS origins on startup

### Connection timeout
- **Check**: Client is connecting to correct IP (192.168.0.103:5174 for LAN, public IP for WAN)
- **Check**: Server is actually running on port 5174
- **Check**: Network connectivity between client and server

## Configuration Summary

| Setting | Value | Location |
|---------|-------|----------|
| Server Port | 5174 | server.ts, .env files |
| Server Binding | 0.0.0.0 | server.ts |
| Client URL | http://192.168.0.103:5174 | .env.development, LobbyScreen.tsx |
| Transport | websocket | socket-client.ts |
| CORS | * | .env files |
| Port Forwarding | 5174 TCP → 192.168.0.103:5174 | Router |

## Next Steps

1. Restart both server and client after applying changes
2. Configure port forwarding on your router
3. Test locally first, then test cross-network
4. Monitor logs for connection details and any errors
