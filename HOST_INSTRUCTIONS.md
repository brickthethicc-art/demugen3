# Mugen Game - Host Instructions

**Your Public IP**: 68.207.133.232  
**Your Local IP**: 192.168.0.103  
**Server Port**: 5174 (game server + client served on same port)  
**Your Local URL**: http://localhost:5174  
**LAN Player URL**: http://192.168.0.103:5174  
**External Player URL**: http://68.207.133.232:5174

---

## For You (The Host)

### Step 1: Start Your Game
1. Open http://localhost:5174 in your browser
2. Enter your player name
3. Click "Create Game"
4. You will receive a lobby code (e.g., ABC123)

## Port Forwarding Setup (Required for External Access)

**You only need to forward port 5174 (game server). This single port handles all traffic.**

### Step-by-Step Instructions:

1. **Log into your router**:
   - Open browser and go to: http://192.168.0.1 or http://192.168.1.1
   - Enter your router username/password (usually on a sticker on the router)

2. **Find Port Forwarding settings**:
   - Look for one of these sections:
     - "Port Forwarding"
     - "Virtual Server"
     - "NAT / NAT Forwarding"
     - "Gaming / Applications"
   - Usually under "Advanced", "Firewall", or "Network" settings

3. **Add the forwarding rule**:
   - Service/Application Name: emugen
   - External Port (Start/End): 5174
   - Internal Port (Start/End): 5174
   - Internal IP Address: 192.168.0.103
   - Protocol: TCP
   - Enable: Yes/Checked

5. **Save and Apply**:
   - Click "Save", "Apply", or "Add"
   - Wait for router to apply changes (may take 1-2 minutes)

6. **Verify Port Forwarding**:
   - From your phone (on cellular, NOT WiFi):
     - Open http://68.207.133.232:5174
     - Should see the game loading
   - Or use an online port checker:
     - Visit https://www.yougetsignal.com/tools/open-ports/
     - Enter 68.207.133.232 and port 5174
     - Should show "Open"

### Common Router Brands:

**Netgear**:
- Advanced → Advanced Setup → Port Forwarding / Port Triggering

**Linksys**:
- Connectivity → Port Forwarding

**TP-Link**:
- Advanced → NAT Forwarding → Virtual Servers

**ASUS**:
- External Network → Port Forwarding

**Xfinity/Comcast**:
- Connected Devices → Port Forwarding

---

## For External Players

Send external players these instructions:

### Connection Information
- **Game Client URL**: http://68.207.133.232:5174
- **Lobby Code**: [Share the code you receive after creating your lobby]

### How External Players Connect

**Simply visit the game client URL**:
1. Open http://68.207.133.232:5174 in their browser
2. Enter their player name
3. Click "Join Game"
4. Enter the lobby code you provided
5. Click "Join"

That's it! No installation or setup required for external players.

---

## Important Note

**You (the host)** should use http://localhost:5174 to avoid NAT loopback issues.  
**External players** should use http://68.207.133.232:5174.

---

## Testing the Connection

### Test 1: Health Check
From any machine, test:
```bash
curl http://68.207.133.232:5174/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-04-25T...",
  "environment": "development"
}
```

### Test 2: WebSocket Connection
Open browser console on external machine and test:
```javascript
const socket = io('http://68.207.133.232:5174');
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
```

---

## Troubleshooting

### External players cannot connect

**Check port forwarding**:
- Verify port 5174 is forwarded to 192.168.0.103
- Check Windows Firewall allows port 5174

**Windows Firewall**:
```powershell
# Allow port 5174
New-NetFirewallRule -DisplayName "emugen" -Direction Inbound -LocalPort 5174 -Protocol TCP -Action Allow
```

**Check server is accessible**:
```bash
# From your local machine
curl http://localhost:5174/health

# From external machine
curl http://68.207.133.232:5174/health
```

### CORS errors

The server is configured with `CORS_ALLOWED_ORIGINS=*` for development. If you see CORS errors, the environment variable may not be set. Restart the server with:
```powershell
$env:CORS_ALLOWED_ORIGINS="*"; pnpm --filter @mugen/server dev
```

---

## Network Information

- **Your Local IP**: 192.168.0.103
- **Your Public IP**: 68.207.133.232
- **Server Port**: 5174 (game server, binds to 0.0.0.0:5174)
- **Client (Vite dev)**: 5173 (local development only)

---

## Quick Start Checklist

- [ ] Server running on port 5174 (binds 0.0.0.0:5174)
- [ ] Vite dev client running on port 5173
- [ ] Port 5174 TCP forwarded on router → 192.168.0.103:5174
- [ ] Windows Firewall allows inbound TCP on port 5174
- [ ] Created lobby and received code
- [ ] Shared server URL and lobby code with external players
- [ ] External players connect via http://68.207.133.232:5174

---

## Current Status

✓ Server running on port 5174 (binds 0.0.0.0:5174)  
✓ Vite dev client running on http://localhost:5173  
✓ CORS configured for external access (CORS_ALLOWED_ORIGINS=*)  
✓ Client configured to connect to public IP (VITE_SERVER_URL=http://68.207.133.232:5174)  

**Next**: Configure port forwarding on your router, then create a lobby and share the code!
