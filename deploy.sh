#!/bin/bash

# Mugen Game Deployment Script
# This script deploys the game to a production VPS

set -e

echo "=== Mugen Deployment Script ==="

# Configuration
APP_DIR="/var/www/mugen"
REPO_URL="https://github.com/yourusername/mugen.git" # Update with your repo
BRANCH="main"
NODE_VERSION="20"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Install dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nginx git curl build-essential

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js already installed: $(node -v)"
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed"
else
    print_success "pnpm already installed: $(pnpm -v)"
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed: $(pm2 -v)"
fi

# Create application directory
echo "Setting up application directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs

# Clone or pull repository
if [ -d "$APP_DIR/.git" ]; then
    echo "Pulling latest changes..."
    cd $APP_DIR
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
    git checkout $BRANCH
fi

# Copy environment file
echo "Configuring environment..."
if [ ! -f "$APP_DIR/.env.production" ]; then
    cp $APP_DIR/.env.example $APP_DIR/.env.production
    print_warning "Please edit $APP_DIR/.env.production with your configuration"
    print_warning "Then run: source $APP_DIR/.env.production"
fi

# Install dependencies
echo "Installing dependencies..."
cd $APP_DIR
pnpm install

# Build packages
echo "Building packages..."
pnpm build

# Set up nginx configuration
echo "Configuring nginx..."
cp $APP_DIR/nginx.conf /etc/nginx/sites-available/mugen
ln -sf /etc/nginx/sites-available/mugen /etc/nginx/sites-enabled/mugen

# Test nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    print_success "Nginx configuration valid"
    systemctl reload nginx
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Set up SSL with Let's Encrypt (optional)
read -p "Do you want to set up SSL with Let's Encrypt? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v certbot &> /dev/null; then
        apt-get install -y certbot python3-certbot-nginx
    fi
    read -p "Enter your domain name: " DOMAIN
    certbot --nginx -d $DOMAIN -d www.$DOMAIN
    print_success "SSL configured"
fi

# Start application with PM2
echo "Starting application with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup | tail -n 1 | bash

print_success "Deployment complete!"
echo ""
echo "=== Next Steps ==="
echo "1. Edit $APP_DIR/.env.production with your configuration"
echo "2. Update nginx.conf with your domain name"
echo "3. If not using SSL, update the redirect in nginx.conf"
echo "4. Restart the application: pm2 restart mugen-server"
echo "5. Check logs: pm2 logs mugen-server"
echo "6. Monitor application: pm2 monit"
echo ""
echo "=== Access Points ==="
echo "Health check: http://your-domain.com/health"
echo "Game: http://your-domain.com"
