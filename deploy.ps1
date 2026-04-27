# Mugen Game Deployment Script for Windows
# This script helps deploy the game to a Windows server

Write-Host "=== Mugen Deployment Script (Windows) ===" -ForegroundColor Cyan

# Configuration
$APP_DIR = "C:\mugen"
$NODE_VERSION = "20"

# Function to check if command exists
function Command-Exists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    }
    catch {
        return $false
    }
    finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Check administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run as Administrator" -ForegroundColor Red
    exit 1
}

# Install Node.js if not present
if (-not (Command-Exists "node")) {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    Write-Host "Node.js installed" -ForegroundColor Green
} else {
    $nodeVersion = node -v
    Write-Host "Node.js already installed: $nodeVersion" -ForegroundColor Green
}

# Install pnpm if not present
if (-not (Command-Exists "pnpm")) {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "pnpm installed" -ForegroundColor Green
} else {
    $pnpmVersion = pnpm -v
    Write-Host "pnpm already installed: $pnpmVersion" -ForegroundColor Green
}

# Install PM2 if not present
if (-not (Command-Exists "pm2")) {
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
    Write-Host "PM2 installed" -ForegroundColor Green
} else {
    $pm2Version = pm2 -v
    Write-Host "PM2 already installed: $pm2Version" -ForegroundColor Green
}

# Create application directory
Write-Host "Setting up application directory..." -ForegroundColor Yellow
if (-not (Test-Path $APP_DIR)) {
    New-Item -ItemType Directory -Path $APP_DIR -Force
    Write-Host "Created directory: $APP_DIR" -ForegroundColor Green
}

# Navigate to application directory
Set-Location $APP_DIR

# Check if this is a git repository
if (Test-Path ".git") {
    Write-Host "Pulling latest changes..." -ForegroundColor Yellow
    git pull origin main
} else {
    Write-Host "Please clone your repository to $APP_DIR" -ForegroundColor Yellow
    Write-Host "Run: git clone <your-repo-url> $APP_DIR"
    exit 1
}

# Copy environment file
Write-Host "Configuring environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env.production")) {
    Copy-Item ".env.example" ".env.production"
    Write-Host "Created .env.production from .env.example" -ForegroundColor Green
    Write-Host "Please edit .env.production with your configuration" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Build packages
Write-Host "Building packages..." -ForegroundColor Yellow
pnpm build

# Start application with PM2
Write-Host "Starting application with PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Edit .env.production with your configuration"
Write-Host "2. Configure your reverse proxy (IIS or nginx)"
Write-Host "3. Open firewall port 3001 (and 80/443 for web)"
Write-Host "4. Restart the application: pm2 restart mugen-server"
Write-Host "5. Check logs: pm2 logs mugen-server"
Write-Host "6. Monitor application: pm2 monit"
