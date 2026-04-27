# Mugen Multiplayer Game - External Hosting Guide

This guide provides comprehensive instructions for hosting the Mugen multiplayer card game on a publicly accessible server with domain name support.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Hosting Options](#hosting-options)
4. [Deployment Steps](#deployment-steps)
5. [Domain Configuration](#domain-configuration)
6. [Security Configuration](#security-configuration)
7. [Testing External Connectivity](#testing-external-connectivity)
8. [Troubleshooting](#troubleshooting)
9. [Current Issues](#current-issues)
10. [Remaining Risks](#remaining-risks)

---

## Architecture Overview

### System Components

- **Frontend**: React + Phaser game client (Vite build)
- **Backend**: Node.js server with Fastify + Socket.IO
- **Communication**: WebSocket (Socket.IO) for real-time multiplayer
- **Reverse Proxy**: Nginx (HTTPS termination, WebSocket support)
- **Process Manager**: PM2 (production process management)

### Network Flow

```
Player Browser
    ↓ (HTTPS/WSS)
Nginx (Port 443)
    ↓ (HTTP/WS)
Game Server (Port 3001)
    ↓
In-Memory Game State
```

### Ports

- **443**: HTTPS (public)
- **80**: HTTP (redirects to HTTPS)
- **3001**: Game server (internal, behind nginx)
- **5173**: Vite dev server (development only)

---

## Prerequisites

### Required Software

- **Node.js**: >= 20.0.0
- **pnpm**: Latest version
- **nginx**: Web server/reverse proxy
- **PM2**: Process manager
- **Git**: Version control

### Required Hardware

- **Minimum**: 1 CPU, 1GB RAM
- **Recommended**: 2 CPU, 2GB RAM
- **Storage**: 10GB+ SSD

---

## Hosting Options

### Option 1: Cloud VPS (Recommended)

**Providers**:
- DigitalOcean ($4-8/month)
- Linode ($5/month)
- AWS EC2 (Free tier available)
- Vultr ($5/month)
- Hetzner (~€4/month)

**Pros**:
- Full control
- Scalable
- Cost-effective
- Global availability

**Cons**:
- Requires manual setup
- Need to manage updates

### Option 2: Platform-as-a-Service

**Providers**:
- Railway.app ($5+/month)
- Render ($7+/month)
- Fly.io

**Pros**:
- Easy deployment
- Automatic SSL
- Built-in scaling

**Cons**:
- Higher cost
- Less control
- WebSocket support varies

---

## Deployment Steps

### Step 1: Prepare Your Server

#### For Linux (Ubuntu/Debian):

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y nginx git curl build-essential

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

#### For Windows Server:

```powershell
# Install Node.js from https://nodejs.org
# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone <your-repo-url> /var/www/mugen
cd /var/www/mugen
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit with your configuration
nano .env
```

**Required variables in `.env`**:
```env
NODE_ENV=production
PORT=3001
VITE_SERVER_URL=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Step 4: Install Dependencies and Build

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Step 5: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/mugen

# Edit the configuration with your domain
sudo nano /etc/nginx/sites-available/mugen
# Update: server_name your-domain.com www.your-domain.com;

# Enable the site
sudo ln -s /etc/nginx/sites-available/mugen /etc/nginx/sites-enabled/mugen

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 6: Set Up SSL (HTTPS)

#### Using Let's Encrypt (Free):

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically configure nginx for HTTPS
```

#### Manual SSL:

1. Purchase SSL certificate from provider
2. Upload certificate files to `/etc/ssl/certs/mugen.crt`
3. Upload private key to `/etc/ssl/private/mugen.key`
4. Update nginx.conf with correct paths

### Step 7: Start Application with PM2

```bash
# Start the server
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup | tail -n 1 | sudo bash
```

### Step 8: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9: Alternative: Automated Deployment

Use the provided deployment script:

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment (requires root)
sudo ./deploy.sh
```

---

## Domain Configuration

### DNS Setup

1. **Log in to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Add A Record**:
   - Type: A
   - Name: @ (or your subdomain)
   - Value: Your server's public IP address
   - TTL: 3600 (or default)

3. **Add CNAME for www** (optional):
   - Type: CNAME
   - Name: www
   - Value: your-domain.com
   - TTL: 3600

4. **Wait for propagation** (5 minutes to 48 hours)

### Verify DNS

```bash
# Check if domain resolves
nslookup your-domain.com
# or
dig your-domain.com
```

---

## Security Configuration

### Current Security Measures

1. **CORS**: Configured to allow specific origins in production
2. **Environment-based configuration**: Separate dev/prod settings
3. **Nginx security headers**: X-Frame-Options, X-Content-Type-Options, etc.
4. **HTTPS**: SSL/TLS encryption

### Recommended Additional Security

1. **Rate Limiting** (add to nginx):
```nginx
# Add to http block in nginx.conf
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Add to location /socket.io/
limit_req zone=api burst=20 nodelay;
```

2. **Input Validation**: Already implemented in action-resolver.ts
3. **Authentication**: Consider adding player authentication system
4. **DDoS Protection**: Use Cloudflare or similar service
5. **Regular Updates**: Keep Node.js and dependencies updated

---

## Testing External Connectivity

### Step 1: Health Check

```bash
# Test from server
curl http://localhost:3001/health

# Test from external machine
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Step 2: WebSocket Connection Test

Use browser console or WebSocket testing tool:

```javascript
const socket = io('https://your-domain.com');
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
```

### Step 3: Full Game Test

1. Open `https://your-domain.com` in browser
2. Create a lobby
3. Share lobby code with friend
4. Have friend join from different network
5. Test gameplay synchronization
6. Verify no desync or disconnects

### Step 4: Multi-User Test

- Test with 2-4 concurrent players
- Test from different geographic locations
- Test on mobile devices
- Test with slow network conditions

---

## Troubleshooting

### Issue: Cannot connect to server

**Check**:
```bash
# Is server running?
pm2 status

# Check logs
pm2 logs mugen-server

# Is nginx running?
sudo systemctl status nginx

# Is port 3001 listening?
sudo netstat -tlnp | grep 3001
```

**Solution**: Restart services if needed

### Issue: WebSocket connection fails

**Check**:
- nginx configuration has WebSocket upgrade headers
- Firewall allows port 443
- SSL certificate is valid

**Solution**: Verify nginx configuration and SSL setup

### Issue: CORS errors in browser

**Check**:
- CORS_ALLOWED_ORIGINS includes your domain
- nginx CORS headers are correct

**Solution**: Update environment variables and restart server

### Issue: Game state desync

**Check**:
- All players have stable connection
- Server logs for errors

**Solution**: This is a known issue with in-memory state. Consider adding persistence.

---

## Current Issues

### Identified Issues

1. **In-Memory State**: Game state is stored in memory and lost on server restart
   - **Impact**: Players lose progress if server restarts
   - **Priority**: Medium
   - **Solution**: Add Redis or database persistence

2. **No Rate Limiting**: Server has no rate limiting on API endpoints
   - **Impact**: Vulnerable to abuse/DDoS
   - **Priority**: High
   - **Solution**: Implement rate limiting in nginx or server code

3. **No Authentication**: Players are identified only by socket ID
   - **Impact**: No account system, no persistent identity
   - **Priority**: Low (for MVP)
   - **Solution**: Add JWT-based authentication

4. **No Reconnection Handling**: Clients don't automatically reconnect
   - **Impact**: Players disconnected on network hiccups
   - **Priority**: Medium
   - **Solution**: Add automatic reconnection logic in client

5. **Limited Scaling**: Single server instance
   - **Impact**: Cannot handle large player counts
   - **Priority**: Low (for MVP)
   - **Solution**: Add load balancer and horizontal scaling

---

## Remaining Risks

### Technical Risks

1. **Latency**: Players on different continents may experience lag
   - **Mitigation**: Deploy servers in multiple regions

2. **State Loss**: Server restarts lose all active games
   - **Mitigation**: Add persistence layer (Redis)

3. **Single Point of Failure**: One server failure = total outage
   - **Mitigation**: Add backup server and failover

4. **Memory Leaks**: Long-running server may exhaust memory
   - **Mitigation**: Monitor with PM2, set max memory limits

### Security Risks

1. **No Input Sanitization**: While action-resolver validates, add additional layers
   - **Mitigation**: Implement request validation middleware

2. **No DDoS Protection**: Vulnerable to traffic floods
   - **Mitigation**: Use Cloudflare or similar

3. **CORS Misconfiguration**: If not set correctly, allows unauthorized access
   - **Mitigation**: Strictly validate CORS origins

### Operational Risks

1. **Deployment Complexity**: Manual deployment prone to errors
   - **Mitigation**: Use CI/CD pipeline (GitHub Actions)

2. **Monitoring**: No alerting for server issues
   - **Mitigation**: Add monitoring (Sentry, New Relic, or custom)

3. **Backup**: No automated backups
   - **Mitigation**: Add backup scripts for configuration

---

## Quick Reference

### Useful Commands

```bash
# Check server status
pm2 status

# View logs
pm2 logs mugen-server

# Restart server
pm2 restart mugen-server

# Stop server
pm2 stop mugen-server

# Reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Renew SSL certificate
sudo certbot renew
```

### File Locations

- **Application**: `/var/www/mugen`
- **Nginx config**: `/etc/nginx/sites-available/mugen`
- **SSL certificates**: `/etc/letsencrypt/live/your-domain.com/`
- **PM2 logs**: `/var/www/mugen/logs/`
- **Node.js**: `/usr/bin/node`

### Environment Variables

```env
NODE_ENV=production
PORT=3001
VITE_SERVER_URL=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review server logs: `pm2 logs mugen-server`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Test health endpoint: `curl https://your-domain.com/health`

---

## Version History

- **v1.0** (2024-04-25): Initial external hosting implementation
  - Environment configuration
  - Production-ready CORS
  - Nginx reverse proxy setup
  - SSL/HTTPS support
  - Deployment scripts
  - PM2 process management
