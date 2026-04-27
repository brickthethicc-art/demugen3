# External Connectivity Testing Strategy

This document provides a comprehensive testing strategy for verifying that external users can connect to the Mugen multiplayer game from outside the local network.

## Pre-Testing Checklist

- [ ] Server deployed to public VPS
- [ ] Domain name configured with DNS A record
- [ ] SSL/HTTPS certificate installed
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Nginx reverse proxy configured
- [ ] PM2 process manager running
- [ ] Environment variables set correctly

---

## Test 1: DNS Resolution

### Objective
Verify that the domain name resolves to the correct public IP address.

### Steps

1. **From local machine**:
   ```bash
   nslookup your-domain.com
   # or
   dig your-domain.com
   ```

2. **From online tool**:
   - Visit https://www.whatsmydns.net/
   - Enter your domain
   - Check that all servers show the correct IP

### Expected Result
- Domain resolves to your server's public IP
- Resolution works from multiple geographic locations

### Failure Indicators
- Domain does not resolve
- Resolves to wrong IP
- Inconsistent results across regions

---

## Test 2: HTTP/HTTPS Connectivity

### Objective
Verify that the web server is accessible via HTTP and HTTPS.

### Steps

1. **Test HTTP redirect to HTTPS**:
   ```bash
   curl -I http://your-domain.com
   ```
   Expected: 301 redirect to HTTPS

2. **Test HTTPS access**:
   ```bash
   curl -I https://your-domain.com
   ```
   Expected: 200 OK

3. **Test SSL certificate**:
   ```bash
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```
   Expected: Valid certificate chain

4. **Test from browser**:
   - Open https://your-domain.com
   - Check for SSL certificate warnings
   - Verify padlock icon appears

### Expected Result
- HTTP redirects to HTTPS
- HTTPS returns 200 OK
- SSL certificate is valid and trusted
- No certificate warnings in browser

### Failure Indicators
- HTTP does not redirect
- HTTPS returns error
- SSL certificate expired or invalid
- Browser shows security warnings

---

## Test 3: Health Check Endpoint

### Objective
Verify that the server health endpoint is accessible and returns correct data.

### Steps

1. **From local machine**:
   ```bash
   curl https://your-domain.com/health
   ```

2. **From external network** (e.g., mobile phone on cellular):
   ```bash
   curl https://your-domain.com/health
   ```

### Expected Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Expected Result
- Returns 200 OK
- Response contains status, timestamp, and environment
- Response is identical from different networks

### Failure Indicators
- Returns 404, 500, or other error
- Response missing required fields
- Different responses from different networks

---

## Test 4: WebSocket Connection

### Objective
Verify that WebSocket connections can be established from external networks.

### Steps

1. **Using browser console** (on external network):
   ```javascript
   const socket = io('https://your-domain.com');
   socket.on('connect', () => console.log('✓ Connected!', socket.id));
   socket.on('disconnect', () => console.log('✗ Disconnected'));
   socket.on('connect_error', (err) => console.error('✗ Error:', err));
   ```

2. **Using WebSocket testing tool**:
   - Visit https://www.piesocket.com/websocket-tester
   - Connect to `wss://your-domain.com/socket.io/`
   - Test sending/receiving messages

3. **Using command line**:
   ```bash
   wscat -c wss://your-domain.com/socket.io/
   ```

### Expected Result
- Connection establishes successfully
- Socket ID is assigned
- No connection errors
- Can send and receive messages

### Failure Indicators
- Connection refused
- Connection timeout
- SSL handshake errors
- CORS errors in console

---

## Test 5: Full Game Flow - Single Player

### Objective
Verify that a single external player can access and navigate the game.

### Steps

1. **From external network** (e.g., mobile on cellular):
   - Navigate to https://your-domain.com
   - Verify page loads completely
   - Enter player name
   - Click "Create Game"
   - Verify lobby is created
   - Note lobby code

### Expected Result
- Game UI loads without errors
- Player can enter name
- Lobby created successfully
- Lobby code displayed

### Failure Indicators
- Page fails to load
- JavaScript errors in console
- Cannot create lobby
- Network errors in console

---

## Test 6: Full Game Flow - Multiplayer

### Objective
Verify that multiple external players can join the same game and interact.

### Steps

1. **Player 1** (on Network A):
   - Navigate to https://your-domain.com
   - Create lobby
   - Note lobby code: ABC123

2. **Player 2** (on Network B - different location):
   - Navigate to https://your-domain.com
   - Enter lobby code: ABC123
   - Join lobby

3. **Verify**:
   - Both players see each other in lobby
   - Player counts match (2/4)
   - Both can toggle ready status
   - Host can start game

4. **Start game**:
   - Both players confirm starting units
   - Game transitions to gameplay
   - Both players see board state

### Expected Result
- Both players connect successfully
- Lobby synchronization works
- Game state updates in real-time
- No desync or lag

### Failure Indicators
- Second player cannot join
- Players don't see each other
- Lobby desync
- Game fails to start
- State desync during gameplay

---

## Test 7: Concurrent Players

### Objective
Test the server with multiple concurrent connections from different networks.

### Steps

1. **Recruit 3-4 testers** on different networks:
   - Tester A: Home WiFi
   - Tester B: Mobile cellular
   - Tester C: Office network
   - Tester D: VPN/different country

2. **All join same lobby**:
   - Share lobby code
   - All join simultaneously
   - Verify all appear in lobby

3. **Test gameplay**:
   - Start game
   - All players make moves
   - Verify state syncs correctly

4. **Monitor server**:
   ```bash
   pm2 logs mugen-server
   pm2 monit
   ```

### Expected Result
- All players connect successfully
- No connection drops
- State remains synchronized
- Server handles load without errors

### Failure Indicators
- Connection timeouts
- Players dropped
- Server crashes
- High latency
- Memory leaks

---

## Test 8: Network Interruption Recovery

### Objective
Test that the game handles network interruptions gracefully.

### Steps

1. **Player in active game**:
   - Start a game
   - Make a few moves

2. **Simulate network interruption**:
   - Disable WiFi/switch to airplane mode for 10 seconds
   - Re-enable network

3. **Verify**:
   - Player reconnects automatically
   - Game state syncs on reconnection
   - Can continue playing

### Expected Result
- Automatic reconnection
- State syncs correctly
- No game-breaking errors

### Failure Indicators
- Player cannot reconnect
- State corrupted
- Game freezes
- Need to refresh page

---

## Test 9: Cross-Region Latency

### Objective
Test gameplay from different geographic regions.

### Steps

1. **Test from different locations**:
   - Local (same continent as server)
   - Different continent
   - Use VPN to simulate different regions

2. **Measure latency**:
   - Browser DevTools → Network
   - Check WebSocket frame timing
   - Measure round-trip time

3. **Test gameplay**:
   - Make moves from each region
   - Note any lag or delay

### Expected Result
- Latency < 100ms for same continent
- Latency < 300ms for different continents
- Gameplay remains playable
- No noticeable input delay

### Failure Indicators
- Latency > 500ms
- Unplayable lag
- Input delay noticeable
- Moves not registering

---

## Test 10: Mobile Devices

### Objective
Verify the game works on mobile devices from external networks.

### Steps

1. **Test on iOS**:
   - Safari browser
   - Test from cellular (not WiFi)
   - Full game flow

2. **Test on Android**:
   - Chrome browser
   - Test from cellular (not WiFi)
   - Full game flow

3. **Verify**:
   - Touch controls work
   - UI scales correctly
   - No mobile-specific errors

### Expected Result
- Game loads on mobile
- Touch controls responsive
- UI properly scaled
- No mobile-specific issues

### Failure Indicators
- Page fails to load
- Touch not working
- UI broken on mobile
- Mobile-specific errors

---

## Test 11: Load Testing

### Objective
Test server performance under load.

### Steps

1. **Use load testing tool** (e.g., Artillery, k6):
   ```javascript
   // Artillery config example
   {
     "target": "https://your-domain.com",
     "phases": [
       { "duration": 60, "arrivalRate": 10 },
       { "duration": 60, "arrivalRate": 50 },
       { "duration": 60, "arrivalRate": 100 }
     ],
     "scenarios": [
       {
         "name": "Health check",
         "requests": [
           { "get": { "url": "/health" } }
         ]
       }
     ]
   }
   ```

2. **Monitor server resources**:
   ```bash
   pm2 monit
   htop
   ```

### Expected Result
- Server handles load without crashing
- Response times remain acceptable
- Memory usage stable
- No memory leaks

### Failure Indicators
- Server crashes
- Response times degrade significantly
- Memory usage grows unbounded
- CPU usage at 100%

---

## Test 12: Security Testing

### Objective
Verify basic security measures are in place.

### Steps

1. **Test CORS**:
   - Try to access from unauthorized domain
   - Verify CORS error

2. **Test rate limiting**:
   ```bash
   # Send many requests quickly
   for i in {1..200}; do curl https://your-domain.com/health; done
   ```
   - Should receive 429 after limit

3. **Test HTTPS enforcement**:
   - Try HTTP, verify redirect to HTTPS

4. **Test WebSocket security**:
   - Try to connect without proper origin
   - Verify connection rejected

### Expected Result
- CORS blocks unauthorized origins
- Rate limiting activates after threshold
- HTTP redirects to HTTPS
- WebSocket connections validated

### Failure Indicators
- CORS allows all origins
- No rate limiting
- HTTP does not redirect
- WebSocket accepts any connection

---

## Automated Testing Script

Create a test script to automate basic connectivity tests:

```bash
#!/bin/bash

DOMAIN="your-domain.com"

echo "=== Testing External Connectivity for $DOMAIN ==="

# Test 1: DNS
echo "1. Testing DNS resolution..."
nslookup $DOMAIN || { echo "✗ DNS resolution failed"; exit 1; }
echo "✓ DNS resolution OK"

# Test 2: HTTP to HTTPS redirect
echo "2. Testing HTTP redirect..."
curl -I http://$DOMAIN 2>&1 | grep -q "301" || { echo "✗ HTTP redirect failed"; exit 1; }
echo "✓ HTTP redirect OK"

# Test 3: HTTPS
echo "3. Testing HTTPS..."
curl -I https://$DOMAIN 2>&1 | grep -q "200" || { echo "✗ HTTPS failed"; exit 1; }
echo "✓ HTTPS OK"

# Test 4: Health endpoint
echo "4. Testing health endpoint..."
curl -s https://$DOMAIN/health | grep -q "ok" || { echo "✗ Health check failed"; exit 1; }
echo "✓ Health check OK"

echo "=== All tests passed ==="
```

---

## Test Results Template

Use this template to document test results:

```
Date: [DATE]
Tester: [NAME]
Server: [DOMAIN]
Location: [LOCATION]

Test 1 - DNS Resolution: [PASS/FAIL]
Test 2 - HTTP/HTTPS: [PASS/FAIL]
Test 3 - Health Check: [PASS/FAIL]
Test 4 - WebSocket: [PASS/FAIL]
Test 5 - Single Player: [PASS/FAIL]
Test 6 - Multiplayer: [PASS/FAIL]
Test 7 - Concurrent Players: [PASS/FAIL]
Test 8 - Network Recovery: [PASS/FAIL]
Test 9 - Cross-Region: [PASS/FAIL]
Test 10 - Mobile: [PASS/FAIL]
Test 11 - Load Testing: [PASS/FAIL]
Test 12 - Security: [PASS/FAIL]

Notes:
[ANY OBSERVATIONS OR ISSUES]

Latency Measurements:
- Same continent: [X]ms
- Different continent: [X]ms

Recommendations:
[ANY IMPROVEMENTS NEEDED]
```

---

## Continuous Monitoring

After initial testing, set up continuous monitoring:

### Tools
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Performance monitoring**: New Relic, Datadog
- **Error tracking**: Sentry
- **Log aggregation**: Papertrail, Loggly

### Key Metrics to Monitor
- Server uptime
- Response times
- Error rates
- WebSocket connection counts
- Memory usage
- CPU usage

### Alerts
- Server down
- Error rate > 5%
- Response time > 1s
- Memory usage > 80%
- WebSocket connection failures

---

## Troubleshooting Common Issues

### Issue: Cannot connect from external network

**Check**:
```bash
# Is server running?
pm2 status

# Is nginx running?
sudo systemctl status nginx

# Is port 443 open?
sudo ufw status

# Check firewall rules
sudo iptables -L -n
```

### Issue: WebSocket connection fails

**Check**:
- nginx configuration has WebSocket upgrade headers
- SSL certificate is valid
- CORS origins are correct

### Issue: High latency

**Check**:
- Server location vs player location
- Network quality
- Server resource usage
- Consider CDN or edge servers

### Issue: Players disconnecting

**Check**:
- Server logs for errors
- Network stability
- WebSocket timeout settings
- Client reconnection logic
